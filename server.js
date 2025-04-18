// Required imports
const { apiKeyAuth } = require("./middleware/auth");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const admin = require("firebase-admin");
require("dotenv").config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK with service account
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

// Define port
const PORT = process.env.PORT || 3000;
async function subscribeToTopics(token, topics) {
  // Subscribe the device to each topic in array
  for (const topic of topics) {
    await admin.messaging().subscribeToTopic(token, topic);
    console.log(`Device ${token.substring(0, 10)}... subscribed to ${topic}`);
  }
  return {
    success: true,
    message: `Successfully subscribed to ${topics.join(", ")}`,
  };
}

app.post("/api/subscribe", async (req, res) => {
  try {
    const { token, topics } = req.body;

    // Validate request body
    if (!token || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Token and topics array are required",
      });
    }

    const result = await subscribeToTopics(token, topics);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error subscribing to topic:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to subscribe to topic",
      error: error.message,
    });
  }
});

// Make proxy endpoint not require authentication
app.use("/api/subscribe-proxy", express.json());
app.post("/api/subscribe-proxy", async (req, res) => {
  try {
    const { token, topics } = req.body;

    // Validate request body
    if (!token || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Token and topics array are required",
      });
    }

    // Call the subscribe function directly
    const result = await subscribeToTopics(token, topics);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in subscribe-proxy:", error);
    return res.status(500).json({
      success: false,
      message: "Proxy error",
      error: error.message,
    });
  }
});
app.use(apiKeyAuth);

app.post("/api/unsubscribe", async (req, res) => {
  try {
    const { token, topic } = req.body;

    // Validate request body
    if (!token || !topic) {
      return res.status(400).json({
        success: false,
        message: "Token and topic are required",
      });
    }

    // Unsubscribe the device from the topic
    await admin.messaging().unsubscribeFromTopic(token, topic);

    console.log(
      `Device ${token.substring(0, 10)}... unsubscribed from ${topic}`
    );

    return res.status(200).json({
      success: true,
      message: `Successfully unsubscribed from ${topic}`,
    });
  } catch (error) {
    console.error("Error unsubscribing from topic:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unsubscribe from topic",
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
