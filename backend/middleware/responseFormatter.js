/**
 * Standard API Response Formatter Middleware
 * Ensures consistent response format across all routes
 */

const responseFormatter = (req, res, next) => {
  // Override res.json to wrap responses in standard format
  const originalJson = res.json;

  res.json = function (data) {
    // If response already has success property, don't wrap it
    if (data && typeof data === 'object' && 'success' in data) {
      return originalJson.call(this, data);
    }

    // Wrap in standard format
    const formattedResponse = {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    };

    return originalJson.call(this, formattedResponse);
  };

  next();
};

module.exports = responseFormatter;
