const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  // Get the API key from environment variable
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key",
    });
  }

  next();
};

module.exports = { apiKeyAuth };
