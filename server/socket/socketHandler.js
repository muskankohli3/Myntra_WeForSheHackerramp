const LiveSession = require("../models/LiveSession");
const Comment = require("../models/Comment");
const Poll = require("../models/Poll");
const Promotion = require("../models/Promotion");
const Customer = require("../models/Customer");
const Notification = require("../models/Notification");
const { findRepeatedQuestionCluster, suggestReply, similarity } = require("../services/gemini/qnaAI");
const { computeLiveAssistantTip } = require("../services/growthEngine/liveAssistant");

// In-memory room state — resets on server restart, which is fine for a live
// session (a restarted server means the stream dropped anyway, same as real
// platforms).
// rooms.get(liveSessionId) => {
//   sellerSocketId, viewers: Set<socketId>, recentQuestions: [],
//   mutedAuthors: Set<authorName>, pendingQuestions: [{commentId,message,author}],
//   pollVotes: Map<pollId, Set<socketId>>, promotionTimers: Map<promotionId, Timeout>,
//   assistantInterval, assistantCooldowns: Map, assistantStats: {...}
// }
const rooms = new Map();

function getRoom(liveSessionId) {
  if (!rooms.has(liveSessionId)) {
    rooms.set(liveSessionId, {
      sellerSocketId: null,
      viewers: new Set(),
      recentQuestions: [],
      mutedAuthors: new Set(),
      pendingQuestions: [],
      pollVotes: new Map(),
      promotionTimers: new Map(),
      assistantInterval: null,
      assistantCooldowns: new Map(),
      assistantStats: { peakViewers: 0, lastCommentAt: Date.now(), cartAddTimestamps: [] },
    });
  }
  return rooms.get(liveSessionId);
}

function broadcastViewerCount(io, liveSessionId) {
  const room = getRoom(liveSessionId);
  io.to(`live:${liveSessionId}`).emit("viewer-count-update", {
    liveSessionId,
    count: room.viewers.size,
  });
  LiveSession.findByIdAndUpdate(liveSessionId, { viewerCount: room.viewers.size }).catch((err) =>
    console.error("viewerCount persist failed:", err.message)
  );
}

// Pushes a Notification doc + a live socket ping to every customer who
// follows this seller — used for "stream started" / "flash sale" / "coupon
// available" alerts (the customer doesn't have to be in the live room, or
// even the app, to have it waiting for them — see NotificationBell.jsx).
async function notifyFollowers(io, sellerId, payload) {
  try {
    const followers = await Customer.find({ followedSellers: sellerId }).select("_id");
    if (!followers.length) return;
    await Notification.insertMany(
      followers.map((f) => ({ recipientId: f._id, recipientRole: "customer", sellerId, ...payload }))
    );
    followers.forEach((f) => {
      io.to(`user:customer:${f._id}`).emit("notification", payload);
    });
  } catch (err) {
    console.error("notifyFollowers failed:", err.message);
  }
}

// AI Live Assistant tick (deterministic — see growthEngine/liveAssistant.js
// for why this isn't a Gemini call). Runs every 20s for as long as a session
// is live and not paused, and only while the seller's socket is actually
// connected, so it stops the instant they leave the studio.
function startAssistantLoop(io, liveSessionId) {
  const room = getRoom(liveSessionId);
  if (room.assistantInterval) return;

  room.assistantInterval = setInterval(async () => {
    try {
      if (!room.sellerSocketId) return;
      const session = await LiveSession.findById(liveSessionId).populate("pinnedProductId");
      if (!session || session.status !== "live" || session.isPaused) return;

      const now = Date.now();
      room.assistantStats.peakViewers = Math.max(room.assistantStats.peakViewers, room.viewers.size);
      room.assistantStats.cartAddTimestamps = room.assistantStats.cartAddTimestamps.filter(
        (t) => now - t < 2 * 60 * 1000
      );

      const tip = computeLiveAssistantTip(
        {
          viewerCount: room.viewers.size,
          peakViewerCount: room.assistantStats.peakViewers,
          secondsSinceLastComment: Math.round((now - room.assistantStats.lastCommentAt) / 1000),
          cartAddsLast2Min: room.assistantStats.cartAddTimestamps.length,
          pinnedStockRemaining: session.pinnedProductId ? session.pinnedProductId.stock : null,
        },
        room.assistantCooldowns
      );
      if (tip) io.to(room.sellerSocketId).emit("live-assistant-tip", tip);
    } catch (err) {
      console.error("live-assistant tick failed:", err.message);
    }
  }, 20000);
}

function stopAssistantLoop(liveSessionId) {
  const room = rooms.get(liveSessionId);
  if (room?.assistantInterval) {
    clearInterval(room.assistantInterval);
    room.assistantInterval = null;
  }
}

function initializeSocket(io) {
  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // ---- Personal notification channel (works even when not inside a live room) ----
    socket.on("identify", ({ role, userId }) => {
      if (!role || !userId) return;
      socket.data.userId = userId;
      socket.join(`user:${role}:${userId}`);
    });

    // ---- Room join/leave ----
    socket.on("join-session", async ({ liveSessionId, role, username, userId }) => {
      if (!liveSessionId) return;
      const roomName = `live:${liveSessionId}`;
      socket.join(roomName);
      socket.data.liveSessionId = liveSessionId;
      socket.data.role = role;
      socket.data.username = username || (role === "seller" ? "Seller" : "Viewer");
      if (userId) {
        socket.data.userId = userId;
        socket.join(`user:${role}:${userId}`);
      }

      const room = getRoom(liveSessionId);

      if (role === "seller") {
        room.sellerSocketId = socket.id;
      } else {
        room.viewers.add(socket.id);
        broadcastViewerCount(io, liveSessionId);
        try {
          await LiveSession.findByIdAndUpdate(liveSessionId, {
            $inc: { totalViews: 1 },
            $max: { peakViewerCount: room.viewers.size },
          });
        } catch (err) {
          console.error("join-session view-count update failed:", err.message);
        }
      }

      console.log(`📺 ${socket.id} (${role || "unknown"}) joined ${roomName}`);
    });

    socket.on("leave-session", ({ liveSessionId }) => {
      if (!liveSessionId) return;
      const roomName = `live:${liveSessionId}`;
      socket.leave(roomName);

      const room = getRoom(liveSessionId);
      if (room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        broadcastViewerCount(io, liveSessionId);
        if (room.sellerSocketId) {
          io.to(room.sellerSocketId).emit("viewer-left", { viewerSocketId: socket.id });
        }
      }
      if (room.sellerSocketId === socket.id) {
        room.sellerSocketId = null;
      }
    });

    // ---- Chat: persist + broadcast in one step ----
    socket.on("send-comment", async ({ liveSessionId, author, message, isQuestion }) => {
      try {
        if (!liveSessionId || !message || !message.trim()) return;
        const authorRole = socket.data.role === "seller" ? "seller" : "customer";
        const authorName = author || socket.data.username || "Guest";

        const room = getRoom(liveSessionId);
        if (authorRole === "customer" && room.mutedAuthors.has(authorName)) {
          socket.emit("comment-error", { message: "You've been muted by the host in this stream." });
          return;
        }

        const comment = await Comment.create({
          liveSessionId,
          author: authorName,
          authorRole,
          message: message.trim(),
          isQuestion: !!isQuestion,
        });

        room.assistantStats.lastCommentAt = Date.now();
        io.to(`live:${liveSessionId}`).emit("new-comment", { liveSessionId, comment });

        if (isQuestion) {
          await LiveSession.findByIdAndUpdate(liveSessionId, { $inc: { totalQuestions: 1 } });

          room.pendingQuestions.push({ commentId: comment._id, message: comment.message, author: authorName });
          if (room.pendingQuestions.length > 40) room.pendingQuestions.shift();

          // ---- AI touchpoint 7: detect repeated/similar questions, suggest a reply to the seller ----
          room.recentQuestions.push({ message: comment.message, _id: comment._id });
          if (room.recentQuestions.length > 12) room.recentQuestions.shift();

          const cluster = findRepeatedQuestionCluster(room.recentQuestions);
          if (cluster && room.sellerSocketId) {
            const session = await LiveSession.findById(liveSessionId).populate("pinnedProductId");
            const reply = await suggestReply(cluster, session?.pinnedProductId || null);
            io.to(room.sellerSocketId).emit("ai-suggested-reply", {
              liveSessionId,
              reply,
              basedOnQuestions: cluster.map((c) => c.message),
            });
            room.recentQuestions = [];
          }
        }
      } catch (err) {
        console.error("send-comment failed:", err.message);
        socket.emit("comment-error", { message: "Could not send comment." });
      }
    });

    // ---- Q&A: upvote a pending question (viewers surface what matters most) ----
    socket.on("upvote-question", async ({ liveSessionId, commentId }) => {
      try {
        if (!liveSessionId || !commentId) return;
        const comment = await Comment.findByIdAndUpdate(commentId, { $inc: { upvotes: 1 } }, { new: true });
        if (comment) {
          io.to(`live:${liveSessionId}`).emit("comment-updated", { commentId, upvotes: comment.upvotes });
        }
      } catch (err) {
        console.error("upvote-question failed:", err.message);
      }
    });

    // ---- Seller answers a question: persists the reply AND auto-resolves near-duplicate
    // questions from other viewers, so the seller doesn't have to repeat themselves. ----
    socket.on("answer-question", async ({ liveSessionId, commentId, replyText }) => {
      try {
        if (socket.data.role !== "seller" || !liveSessionId || !commentId || !replyText?.trim()) return;

        const original = await Comment.findByIdAndUpdate(commentId, { isAnswered: true }, { new: true });
        if (!original) return;

        const replyComment = await Comment.create({
          liveSessionId,
          author: socket.data.username || "Seller",
          authorRole: "seller",
          message: replyText.trim(),
          isQuestion: false,
        });
        io.to(`live:${liveSessionId}`).emit("new-comment", { liveSessionId, comment: replyComment });
        io.to(`live:${liveSessionId}`).emit("comment-updated", { commentId: original._id, isAnswered: true });

        const room = getRoom(liveSessionId);
        const duplicates = room.pendingQuestions.filter(
          (q) => String(q.commentId) !== String(commentId) && similarity(q.message, original.message) >= 0.5
        );
        if (duplicates.length) {
          const ids = duplicates.map((d) => d.commentId);
          await Comment.updateMany({ _id: { $in: ids } }, { isAnswered: true });
          ids.forEach((id) => io.to(`live:${liveSessionId}`).emit("comment-updated", { commentId: id, isAnswered: true }));
          io.to(`live:${liveSessionId}`).emit("duplicate-answered", {
            liveSessionId,
            answeredCount: duplicates.length,
            forQuestion: original.message,
          });
        }
        const resolvedIds = new Set([String(commentId), ...duplicates.map((d) => String(d.commentId))]);
        room.pendingQuestions = room.pendingQuestions.filter((q) => !resolvedIds.has(String(q.commentId)));
      } catch (err) {
        console.error("answer-question failed:", err.message);
      }
    });

    // ---- Chat moderation: delete / pin / mute (seller only) ----
    socket.on("moderate-comment", async ({ liveSessionId, commentId, action, authorName }) => {
      try {
        if (socket.data.role !== "seller" || !liveSessionId) return;
        const room = getRoom(liveSessionId);

        if (action === "delete" && commentId) {
          await Comment.findByIdAndUpdate(commentId, { deleted: true });
          room.pendingQuestions = room.pendingQuestions.filter((q) => String(q.commentId) !== String(commentId));
          io.to(`live:${liveSessionId}`).emit("comment-deleted", { commentId });
        } else if (action === "pin" && commentId) {
          await Comment.updateMany({ liveSessionId, pinned: true }, { pinned: false });
          await Comment.findByIdAndUpdate(commentId, { pinned: true });
          io.to(`live:${liveSessionId}`).emit("comment-pinned", { commentId });
        } else if (action === "unpin") {
          if (commentId) await Comment.findByIdAndUpdate(commentId, { pinned: false });
          io.to(`live:${liveSessionId}`).emit("comment-pinned", { commentId: null });
        } else if (action === "mute" && authorName) {
          room.mutedAuthors.add(authorName);
          io.to(`live:${liveSessionId}`).emit("user-muted", { authorName });
        }
      } catch (err) {
        console.error("moderate-comment failed:", err.message);
      }
    });

    // ---- Reactions: ephemeral (no persistence beyond a running like-count) ----
    socket.on("reaction", ({ liveSessionId, emoji }) => {
      if (!liveSessionId || !emoji) return;
      io.to(`live:${liveSessionId}`).emit("reaction", { liveSessionId, emoji, from: socket.id });
      LiveSession.findByIdAndUpdate(liveSessionId, { $inc: { totalLikes: 1 } }).catch(() => {});
    });

    // ---- Polls ----
    socket.on("poll-create", async ({ liveSessionId, question, options }) => {
      try {
        if (socket.data.role !== "seller" || !liveSessionId || !question?.trim() || !options?.length) return;
        const poll = await Poll.create({
          liveSessionId,
          sellerId: socket.data.userId,
          question: question.trim(),
          options: options.filter(Boolean).map((text) => ({ text, votes: 0 })),
        });
        io.to(`live:${liveSessionId}`).emit("poll-new", poll);
      } catch (err) {
        console.error("poll-create failed:", err.message);
      }
    });

    socket.on("poll-vote", async ({ liveSessionId, pollId, optionIndex }) => {
      try {
        if (!liveSessionId || !pollId || optionIndex === undefined || optionIndex === null) return;
        const room = getRoom(liveSessionId);
        if (!room.pollVotes.has(pollId)) room.pollVotes.set(pollId, new Set());
        const votedSet = room.pollVotes.get(pollId);
        if (votedSet.has(socket.id)) return; // one vote per connection
        votedSet.add(socket.id);

        const poll = await Poll.findById(pollId);
        if (!poll || poll.status !== "active" || !poll.options[optionIndex]) return;
        poll.options[optionIndex].votes += 1;
        await poll.save();
        io.to(`live:${liveSessionId}`).emit("poll-update", poll);
      } catch (err) {
        console.error("poll-vote failed:", err.message);
      }
    });

    socket.on("poll-close", async ({ liveSessionId, pollId }) => {
      try {
        if (socket.data.role !== "seller" || !pollId) return;
        const poll = await Poll.findByIdAndUpdate(pollId, { status: "closed" }, { new: true });
        if (poll) io.to(`live:${liveSessionId}`).emit("poll-closed", poll);
      } catch (err) {
        console.error("poll-close failed:", err.message);
      }
    });

    // ---- Promotions: coupon / flash sale / bundle / BOGO ----
    socket.on(
      "promotion-start",
      async ({ liveSessionId, type, title, code, discountPercent, productId, flashPrice, durationSeconds }) => {
        try {
          if (socket.data.role !== "seller" || !liveSessionId || !type || !title?.trim()) return;
          const duration = Math.min(Math.max(durationSeconds || 300, 30), 3600);

          const promo = await Promotion.create({
            liveSessionId,
            sellerId: socket.data.userId,
            type,
            title: title.trim(),
            code: code || "",
            discountPercent: discountPercent || 0,
            productId: productId || null,
            flashPrice: flashPrice ?? null,
            endsAt: new Date(Date.now() + duration * 1000),
          });
          io.to(`live:${liveSessionId}`).emit("promotion-new", promo);

          const room = getRoom(liveSessionId);
          const timer = setTimeout(async () => {
            try {
              const ended = await Promotion.findByIdAndUpdate(promo._id, { status: "ended" }, { new: true });
              if (ended) io.to(`live:${liveSessionId}`).emit("promotion-ended", ended);
            } catch (err) {
              console.error("promotion auto-end failed:", err.message);
            }
            room.promotionTimers.delete(String(promo._id));
          }, duration * 1000);
          room.promotionTimers.set(String(promo._id), timer);

          if (type === "coupon" || type === "flash_sale") {
            notifyFollowers(io, socket.data.userId, {
              type: type === "coupon" ? "coupon_available" : "flash_sale",
              title: type === "coupon" ? `New coupon: ${title}` : `Flash sale live: ${title}`,
              body: "A seller you follow just started a live offer — join now!",
              liveSessionId,
            });
          }
        } catch (err) {
          console.error("promotion-start failed:", err.message);
        }
      }
    );

    socket.on("promotion-claim", async ({ liveSessionId, promotionId }) => {
      try {
        if (!promotionId || !socket.data.userId) return;
        const promo = await Promotion.findByIdAndUpdate(
          promotionId,
          { $addToSet: { claimedBy: socket.data.userId } },
          { new: true }
        );
        if (promo) io.to(`live:${liveSessionId}`).emit("promotion-update", promo);
      } catch (err) {
        console.error("promotion-claim failed:", err.message);
      }
    });

    // ---- Pin product: persist + broadcast in one step ----
    socket.on("pin-product", async ({ liveSessionId, productId }) => {
      try {
        if (!liveSessionId) return;
        const session = await LiveSession.findByIdAndUpdate(
          liveSessionId,
          { pinnedProductId: productId || null },
          { new: true }
        ).populate("pinnedProductId");
        if (!session) return;

        io.to(`live:${liveSessionId}`).emit("pinned-product-update", {
          liveSessionId,
          product: session.pinnedProductId,
        });
      } catch (err) {
        console.error("pin-product failed:", err.message);
      }
    });

    // ---- Cart-opened signal (feeds the seller's live pulse metrics + AI assistant) ----
    socket.on("cart-add", async ({ liveSessionId }) => {
      try {
        if (!liveSessionId) return;
        getRoom(liveSessionId).assistantStats.cartAddTimestamps.push(Date.now());
        const session = await LiveSession.findByIdAndUpdate(
          liveSessionId,
          { $inc: { totalAddToCarts: 1 } },
          { new: true }
        );
        if (session) {
          io.to(`live:${liveSessionId}`).emit("cart-count-update", {
            liveSessionId,
            count: session.totalAddToCarts,
          });
        }
      } catch (err) {
        console.error("cart-add failed:", err.message);
      }
    });

    // ---- Session lifecycle (mirrors the REST call, keeps sockets as source of live truth) ----
    socket.on("start-live", async ({ liveSessionId }) => {
      try {
        if (!liveSessionId) return;
        const session = await LiveSession.findByIdAndUpdate(
          liveSessionId,
          { status: "live", isPaused: false, startedAt: new Date() },
          { new: true }
        );
        if (!session) return;

        io.to(`live:${liveSessionId}`).emit("session-status", {
          liveSessionId,
          status: "live",
          startedAt: session.startedAt,
        });

        startAssistantLoop(io, liveSessionId);
        notifyFollowers(io, session.sellerId, {
          type: "stream_started",
          title: "A seller you follow just went live!",
          body: session.title,
          liveSessionId,
        });
      } catch (err) {
        console.error("start-live failed:", err.message);
      }
    });

    // ---- Stream management: pause / resume without ending the session ----
    socket.on("pause-live", async ({ liveSessionId }) => {
      try {
        if (socket.data.role !== "seller" || !liveSessionId) return;
        await LiveSession.findByIdAndUpdate(liveSessionId, { isPaused: true });
        io.to(`live:${liveSessionId}`).emit("session-paused", { liveSessionId, isPaused: true });
      } catch (err) {
        console.error("pause-live failed:", err.message);
      }
    });

    socket.on("resume-live", async ({ liveSessionId }) => {
      try {
        if (socket.data.role !== "seller" || !liveSessionId) return;
        await LiveSession.findByIdAndUpdate(liveSessionId, { isPaused: false });
        io.to(`live:${liveSessionId}`).emit("session-paused", { liveSessionId, isPaused: false });
      } catch (err) {
        console.error("resume-live failed:", err.message);
      }
    });

    socket.on("end-live", async ({ liveSessionId }) => {
      try {
        if (!liveSessionId) return;
        const session = await LiveSession.findByIdAndUpdate(
          liveSessionId,
          { status: "ended", endedAt: new Date() },
          { new: true }
        );
        if (!session) return;

        io.to(`live:${liveSessionId}`).emit("session-status", {
          liveSessionId,
          status: "ended",
          endedAt: session.endedAt,
        });

        const room = rooms.get(liveSessionId);
        if (room) {
          room.promotionTimers.forEach((timer) => clearTimeout(timer));
          if (room.assistantInterval) clearInterval(room.assistantInterval);
        }
        stopAssistantLoop(liveSessionId);
        rooms.delete(liveSessionId);
      } catch (err) {
        console.error("end-live failed:", err.message);
      }
    });

   // ---- AI touchpoint 6: live captions ----
    // Improvement: translation now happens per-CUSTOMER, not once for the
    // whole room. The seller's speech (captured via Web Speech API in their
    // own browser — see useCaptions.js — that's the only reliable place to
    // capture what they're actually saying) is broadcast here as raw,
    // untranslated text. Each viewer's own LiveSession page then calls
    // POST /api/ai/translate-caption with whatever language THEY picked, so
    // two viewers can watch the same Hindi stream with Bengali and Tamil
    // captions simultaneously. See client/src/pages/customer/LiveSession.jsx.
    socket.on("caption-chunk", ({ liveSessionId, text }) => {
      if (!liveSessionId || !text || !text.trim()) return;
      io.to(`live:${liveSessionId}`).emit("caption-update", { liveSessionId, original: text.trim() });
    });

    // ---- WebRTC signaling relay (server never inspects the SDP, just routes it) ----
    socket.on("webrtc-ready", ({ liveSessionId }) => {
      const room = getRoom(liveSessionId);
      if (room.sellerSocketId) {
        io.to(room.sellerSocketId).emit("viewer-wants-stream", { viewerSocketId: socket.id });
      }
    });

    socket.on("webrtc-offer", ({ targetSocketId, sdp }) => {
      if (!targetSocketId) return;
      io.to(targetSocketId).emit("webrtc-offer", { fromSocketId: socket.id, sdp });
    });

    socket.on("webrtc-answer", ({ targetSocketId, sdp }) => {
      if (!targetSocketId) return;
      io.to(targetSocketId).emit("webrtc-answer", { fromSocketId: socket.id, sdp });
    });

    socket.on("webrtc-ice-candidate", ({ targetSocketId, candidate }) => {
      if (!targetSocketId) return;
      io.to(targetSocketId).emit("webrtc-ice-candidate", { fromSocketId: socket.id, candidate });
    });

    // ---- Disconnect cleanup ----
    socket.on("disconnect", () => {
      const { liveSessionId, role } = socket.data;
      if (liveSessionId) {
        const room = getRoom(liveSessionId);
        if (role !== "seller" && room.viewers.has(socket.id)) {
          room.viewers.delete(socket.id);
          broadcastViewerCount(io, liveSessionId);
          if (room.sellerSocketId) {
            io.to(room.sellerSocketId).emit("viewer-left", { viewerSocketId: socket.id });
          }
        }
        if (role === "seller" && room.sellerSocketId === socket.id) {
          room.sellerSocketId = null;
        }
      }
      console.log(`🔴 Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initializeSocket;
