import { useEffect, useState, useCallback, useRef } from "react";
import socket from "../services/socket";
import { commentService } from "../services/commentService";
import { pollService } from "../services/pollService";
import { promotionService } from "../services/promotionService";

let reactionIdCounter = 0;

/**
 * Shared real-time room logic used by both the customer LiveSession page and
 * the seller LiveStudio page. Handles joining/leaving the Socket.io room,
 * chat + Q&A, pinned product sync, viewer count, session status/pause,
 * cart-add pulse, live captions, reactions, polls, promotions (coupons/flash
 * sales), chat moderation, order-placed popups, and (seller only) AI-suggested
 * replies + the Live Assistant tip feed.
 */
export function useLiveRoom(liveSessionId, { role, username, userId, initialPinnedProduct = null } = {}) {
  const [comments, setComments] = useState([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [pinnedProduct, setPinnedProduct] = useState(initialPinnedProduct);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [captions, setCaptions] = useState([]); // [{ original }]
  const [aiSuggestion, setAiSuggestion] = useState(null); // seller only
  const [reactions, setReactions] = useState([]); // ephemeral, for the floating-emoji layer
  const [polls, setPolls] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [mutedAuthors, setMutedAuthors] = useState(new Set());
  const [duplicateAnsweredNotice, setDuplicateAnsweredNotice] = useState(null);
  const [liveAssistantTip, setLiveAssistantTip] = useState(null);
  const [orderPopups, setOrderPopups] = useState([]); // seller only — transient "N orders just placed" toasts
  const [stockByProductId, setStockByProductId] = useState({});
  const [likeCount, setLikeCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenueTotal, setRevenueTotal] = useState(0);
  const joinedRef = useRef(false);

  // Backfill chat/poll/promotion history on mount / whenever the session changes.
  useEffect(() => {
    if (!liveSessionId) return;
    commentService.getForSession(liveSessionId).then(setComments).catch(() => setComments([]));
    pollService.getForSession(liveSessionId).then(setPolls).catch(() => setPolls([]));
    promotionService
      .getForSession(liveSessionId)
      .then((all) => setPromotions(all.filter((p) => p.status === "active")))
      .catch(() => setPromotions([]));
  }, [liveSessionId]);

  useEffect(() => {
    if (!liveSessionId) return undefined;

    function join() {
      socket.emit("join-session", { liveSessionId, role, username, userId });
      joinedRef.current = true;
    }

    if (socket.connected) join();
    socket.on("connect", join);

    function handleNewComment({ liveSessionId: id, comment }) {
      if (id !== liveSessionId) return;
      setComments((prev) => [...prev, comment]);
    }
    function handleCommentUpdated({ commentId, ...patch }) {
      setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, ...patch } : c)));
    }
    function handleCommentDeleted({ commentId }) {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    }
    function handleCommentPinned({ commentId }) {
      setComments((prev) => prev.map((c) => ({ ...c, pinned: c._id === commentId })));
    }
    function handleUserMuted({ authorName }) {
      setMutedAuthors((prev) => new Set(prev).add(authorName));
    }
    function handleDuplicateAnswered(payload) {
      setDuplicateAnsweredNotice(payload);
    }

    function handleViewerCount({ liveSessionId: id, count }) {
      if (id !== liveSessionId) return;
      setViewerCount(count);
    }
    function handlePinnedProduct({ liveSessionId: id, product }) {
      if (id !== liveSessionId) return;
      setPinnedProduct(product);
    }
    function handleSessionStatus({ liveSessionId: id, status }) {
      if (id !== liveSessionId) return;
      setSessionStatus(status);
      if (status === "live") setIsPaused(false);
    }
    function handleSessionPaused({ liveSessionId: id, isPaused: paused }) {
      if (id !== liveSessionId) return;
      setIsPaused(paused);
    }
    function handleCartCount({ liveSessionId: id, count }) {
      if (id !== liveSessionId) return;
      setCartCount(count);
    }
    function handleCaption({ liveSessionId: id, original }) {
      if (id !== liveSessionId) return;
      setCaptions((prev) => [...prev.slice(-4), { original }]);
    }
    function handleAISuggestion({ liveSessionId: id, reply, basedOnQuestions }) {
      if (id !== liveSessionId) return;
      setAiSuggestion({ reply, basedOnQuestions });
    }

    function handleReaction({ liveSessionId: id, emoji }) {
      if (id !== liveSessionId) return;
      setLikeCount((prev) => prev + 1);
      const reactionId = ++reactionIdCounter;
      setReactions((prev) => [...prev.slice(-20), { id: reactionId, emoji }]);
      // Self-clean after the float-up animation finishes (see index.css).
      setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== reactionId)), 2200);
    }

    function handlePollNew(poll) {
      setPolls((prev) => [...prev, poll]);
    }
    function handlePollUpdate(poll) {
      setPolls((prev) => prev.map((p) => (p._id === poll._id ? poll : p)));
    }
    function handlePollClosed(poll) {
      setPolls((prev) => prev.map((p) => (p._id === poll._id ? poll : p)));
    }

    function handlePromotionNew(promo) {
      setPromotions((prev) => [...prev, promo]);
    }
    function handlePromotionUpdate(promo) {
      setPromotions((prev) => prev.map((p) => (p._id === promo._id ? promo : p)));
    }
    function handlePromotionEnded(promo) {
      setPromotions((prev) => prev.filter((p) => p._id !== promo._id));
    }

    function handleOrderPlaced(payload) {
      setOrderCount((prev) => prev + 1);
      setRevenueTotal((prev) => prev + (payload.totalAmount || 0));
      const popupId = `${Date.now()}-${Math.random()}`;
      setOrderPopups((prev) => [...prev.slice(-4), { ...payload, id: popupId }]);
      setTimeout(() => setOrderPopups((prev) => prev.filter((o) => o.id !== popupId)), 6000);
    }
    function handleStockUpdate({ productId, stock, sizeStock }) {
      setStockByProductId((prev) => ({ ...prev, [productId]: { stock, sizeStock } }));
      setPinnedProduct((prev) => (prev && prev._id === productId ? { ...prev, stock, sizeStock } : prev));
    }
    function handleLiveAssistantTip(tip) {
      setLiveAssistantTip(tip);
    }

    socket.on("new-comment", handleNewComment);
    socket.on("comment-updated", handleCommentUpdated);
    socket.on("comment-deleted", handleCommentDeleted);
    socket.on("comment-pinned", handleCommentPinned);
    socket.on("user-muted", handleUserMuted);
    socket.on("duplicate-answered", handleDuplicateAnswered);
    socket.on("viewer-count-update", handleViewerCount);
    socket.on("pinned-product-update", handlePinnedProduct);
    socket.on("session-status", handleSessionStatus);
    socket.on("session-paused", handleSessionPaused);
    socket.on("cart-count-update", handleCartCount);
    socket.on("caption-update", handleCaption);
    socket.on("ai-suggested-reply", handleAISuggestion);
    socket.on("reaction", handleReaction);
    socket.on("poll-new", handlePollNew);
    socket.on("poll-update", handlePollUpdate);
    socket.on("poll-closed", handlePollClosed);
    socket.on("promotion-new", handlePromotionNew);
    socket.on("promotion-update", handlePromotionUpdate);
    socket.on("promotion-ended", handlePromotionEnded);
    socket.on("order-placed", handleOrderPlaced);
    socket.on("stock-update", handleStockUpdate);
    socket.on("live-assistant-tip", handleLiveAssistantTip);

    return () => {
      socket.emit("leave-session", { liveSessionId });
      socket.off("connect", join);
      socket.off("new-comment", handleNewComment);
      socket.off("comment-updated", handleCommentUpdated);
      socket.off("comment-deleted", handleCommentDeleted);
      socket.off("comment-pinned", handleCommentPinned);
      socket.off("user-muted", handleUserMuted);
      socket.off("duplicate-answered", handleDuplicateAnswered);
      socket.off("viewer-count-update", handleViewerCount);
      socket.off("pinned-product-update", handlePinnedProduct);
      socket.off("session-status", handleSessionStatus);
      socket.off("session-paused", handleSessionPaused);
      socket.off("cart-count-update", handleCartCount);
      socket.off("caption-update", handleCaption);
      socket.off("ai-suggested-reply", handleAISuggestion);
      socket.off("reaction", handleReaction);
      socket.off("poll-new", handlePollNew);
      socket.off("poll-update", handlePollUpdate);
      socket.off("poll-closed", handlePollClosed);
      socket.off("promotion-new", handlePromotionNew);
      socket.off("promotion-update", handlePromotionUpdate);
      socket.off("promotion-ended", handlePromotionEnded);
      socket.off("order-placed", handleOrderPlaced);
      socket.off("stock-update", handleStockUpdate);
      socket.off("live-assistant-tip", handleLiveAssistantTip);
      joinedRef.current = false;
    };
  }, [liveSessionId, role, username, userId]);

  const sendComment = useCallback(
    (message, isQuestion = false) => {
      if (!liveSessionId || !message || !message.trim()) return;
      socket.emit("send-comment", { liveSessionId, author: username, message: message.trim(), isQuestion });
    },
    [liveSessionId, username]
  );

  const pinProduct = useCallback(
    (productId) => {
      if (!liveSessionId) return;
      socket.emit("pin-product", { liveSessionId, productId });
    },
    [liveSessionId]
  );

  const notifyCartAdd = useCallback(() => {
    if (!liveSessionId) return;
    socket.emit("cart-add", { liveSessionId });
  }, [liveSessionId]);

  const sendCaptionChunk = useCallback(
    (text) => {
      if (!liveSessionId || !text) return;
      socket.emit("caption-chunk", { liveSessionId, text });
    },
    [liveSessionId]
  );

  const dismissSuggestion = useCallback(() => setAiSuggestion(null), []);

  const sendReaction = useCallback(
    (emoji) => {
      if (!liveSessionId) return;
      socket.emit("reaction", { liveSessionId, emoji });
    },
    [liveSessionId]
  );

  const upvoteQuestion = useCallback(
    (commentId) => {
      if (!liveSessionId) return;
      socket.emit("upvote-question", { liveSessionId, commentId });
    },
    [liveSessionId]
  );

  const answerQuestion = useCallback(
    (commentId, replyText) => {
      if (!liveSessionId || !replyText?.trim()) return;
      socket.emit("answer-question", { liveSessionId, commentId, replyText });
    },
    [liveSessionId]
  );

  const moderateComment = useCallback(
    (commentId, action, authorName) => {
      if (!liveSessionId) return;
      socket.emit("moderate-comment", { liveSessionId, commentId, action, authorName });
    },
    [liveSessionId]
  );

  const createPoll = useCallback(
    (question, options) => {
      if (!liveSessionId || !question?.trim()) return;
      socket.emit("poll-create", { liveSessionId, question, options: options.filter(Boolean) });
    },
    [liveSessionId]
  );

  const votedPollIdsRef = useRef(new Set());
  const votePoll = useCallback(
    (pollId, optionIndex) => {
      if (!liveSessionId || votedPollIdsRef.current.has(pollId)) return;
      votedPollIdsRef.current.add(pollId);
      socket.emit("poll-vote", { liveSessionId, pollId, optionIndex });
    },
    [liveSessionId]
  );

  const closePoll = useCallback(
    (pollId) => {
      if (!liveSessionId) return;
      socket.emit("poll-close", { liveSessionId, pollId });
    },
    [liveSessionId]
  );

  const startPromotion = useCallback(
    (payload) => {
      if (!liveSessionId) return;
      socket.emit("promotion-start", { liveSessionId, ...payload });
    },
    [liveSessionId]
  );

  const claimedPromotionIdsRef = useRef(new Set());
  const claimPromotion = useCallback(
    (promotionId) => {
      if (!liveSessionId || claimedPromotionIdsRef.current.has(promotionId)) return;
      claimedPromotionIdsRef.current.add(promotionId);
      socket.emit("promotion-claim", { liveSessionId, promotionId });
    },
    [liveSessionId]
  );

  const pauseLive = useCallback(() => liveSessionId && socket.emit("pause-live", { liveSessionId }), [liveSessionId]);
  const resumeLive = useCallback(() => liveSessionId && socket.emit("resume-live", { liveSessionId }), [liveSessionId]);
  // These pair with the REST calls in LiveStudio.jsx (liveSessionService.start/.end) —
  // the REST call is what actually flips the DB status, but only THIS emit is what
  // tells every connected viewer's socket in real time. Skipping it (as an earlier
  // version of this hook did) is why a viewer's screen used to hang on "connecting"
  // after the seller ended the stream — the DB was updated, but no one was told.
  const startLive = useCallback(() => liveSessionId && socket.emit("start-live", { liveSessionId }), [liveSessionId]);
  const endLive = useCallback(() => liveSessionId && socket.emit("end-live", { liveSessionId }), [liveSessionId]);
  const dismissDuplicateNotice = useCallback(() => setDuplicateAnsweredNotice(null), []);
  const dismissLiveAssistantTip = useCallback(() => setLiveAssistantTip(null), []);

  return {
    comments,
    viewerCount,
    pinnedProduct,
    sessionStatus,
    isPaused,
    cartCount,
    captions,
    aiSuggestion,
    reactions,
    polls,
    promotions,
    mutedAuthors,
    duplicateAnsweredNotice,
    liveAssistantTip,
    orderPopups,
    stockByProductId,
    likeCount,
    orderCount,
    revenueTotal,
    sendComment,
    pinProduct,
    notifyCartAdd,
    sendCaptionChunk,
    dismissSuggestion,
    sendReaction,
    upvoteQuestion,
    answerQuestion,
    moderateComment,
    createPoll,
    votePoll,
    closePoll,
    startPromotion,
    claimPromotion,
    pauseLive,
    resumeLive,
    startLive,
    endLive,
    dismissDuplicateNotice,
    dismissLiveAssistantTip,
  };
}