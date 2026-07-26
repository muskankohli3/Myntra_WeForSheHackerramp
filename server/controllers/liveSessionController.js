const LiveSession = require("../models/LiveSession");
const Comment = require("../models/Comment");

const POPULATE_FIELDS = [
  { path: "sellerId", select: "brandName name avatarUrl growthScore city zone" },
  { path: "pinnedProductId" },
  { path: "productIds" },
];

// GET /api/live-sessions  (?status=live|scheduled|ended&sellerId=&search=)
const getLiveSessions = async (req, res) => {
  try {
    const { status, sellerId, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (sellerId) filter.sellerId = sellerId;
    if (search) filter.title = { $regex: search, $options: "i" };

    const sessions = await LiveSession.find(filter)
      .populate(POPULATE_FIELDS)
      .sort({ status: 1, createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/live-sessions/:id
const getLiveSessionById = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/live-sessions/mine  (seller's own sessions)
const getMyLiveSessions = async (req, res) => {
  try {
    const sessions = await LiveSession.find({ sellerId: req.seller._id })
      .populate(POPULATE_FIELDS)
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/live-sessions  (seller only — create a scheduled/instant session)
const createLiveSession = async (req, res) => {
  try {
    const { title, description, coverImage, productIds, scheduledFor } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    const session = await LiveSession.create({
      sellerId: req.seller._id,
      title,
      description,
      coverImage,
      productIds: productIds || [],
      pinnedProductId: productIds && productIds.length ? productIds[0] : null,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : new Date(),
      status: "scheduled",
    });

    const populated = await session.populate(POPULATE_FIELDS);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/live-sessions/:id/start  (seller only)
const startLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.seller._id },
      { status: "live", startedAt: new Date() },
      { new: true }
    ).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/live-sessions/:id/end  (seller only)
const endLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.seller._id },
      { status: "ended", endedAt: new Date() },
      { new: true }
    ).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/live-sessions/:id/pause  (seller only — stream management)
const pauseLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.seller._id, status: "live" },
      { isPaused: true },
      { new: true }
    ).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found or not live" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/live-sessions/:id/resume  (seller only — stream management)
const resumeLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.seller._id, status: "live" },
      { isPaused: false },
      { new: true }
    ).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found or not live" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/live-sessions/:id/pin  (seller only — REST fallback; socket "pin-product" is the live path)
const pinProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const session = await LiveSession.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.seller._id },
      { pinnedProductId: productId || null },
      { new: true }
    ).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found" });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/live-sessions/:id/replay  (ended session, full detail incl. comment history)
const getReplay = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id).populate(POPULATE_FIELDS);
    if (!session) return res.status(404).json({ message: "Live session not found" });
    const comments = await Comment.find({ liveSessionId: session._id }).sort({ createdAt: 1 });
    res.json({ session, comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLiveSessions,
  getLiveSessionById,
  getMyLiveSessions,
  createLiveSession,
  startLiveSession,
  endLiveSession,
  pauseLiveSession,
  resumeLiveSession,
  pinProduct,
  getReplay,
};
