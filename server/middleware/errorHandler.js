/* eslint-disable no-unused-vars */

// 404 handler — mounted after all routes.
function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler — catches anything thrown/next(err)'d from controllers.
function errorHandler(err, req, res, next) {
  console.error("🔥 Server error:", err.message);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
}

module.exports = { notFound, errorHandler };
