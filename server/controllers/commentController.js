const Comment = require("../models/Comment");

// GET /api/comments/live-session/:liveSessionId
// Used to backfill chat history when a component mounts mid-stream (e.g. a
// viewer joins late, or the seller refreshes) — the live path is the socket
// "send-comment"/"new-comment" pair in server/socket/socketHandler.js.
// Deleted (moderated) comments are excluded — a delete should look permanent
// to anyone loading history fresh, not just disappear for already-connected clients.
const getCommentsForSession = async (req, res) => {
  try {
    const comments = await Comment.find({ liveSessionId: req.params.liveSessionId, deleted: false }).sort({
      createdAt: 1,
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCommentsForSession };
