const Poll = require("../models/Poll");

// GET /api/polls/live-session/:liveSessionId
// Backfills poll history for a viewer who joins mid-stream or a seller who
// refreshes — the live path is the socket "poll-create"/"poll-vote" pair in
// server/socket/socketHandler.js (same convention as comments).
const getPollsForSession = async (req, res) => {
  try {
    const polls = await Poll.find({ liveSessionId: req.params.liveSessionId }).sort({ createdAt: 1 });
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPollsForSession };
