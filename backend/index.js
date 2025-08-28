import cors from "cors";
import express from "express";
import chatRoutes from "./chatRoutes.js";

const app = express();
const port = process.env.PORT || 8888;

// CORS configuration
app.use(
  cors({
    origin: [
      "https://aura-chat-assistant.onrender.com",
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());

// Root endpoint
app.get("/", (req, res) => {
  res.send("Insta AI assistant Backend is running!");
});

// Mount the router with error handling
try {
  app.use("/api", chatRoutes);
} catch (error) {
  console.error("Error mounting routes:", error);
}

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
