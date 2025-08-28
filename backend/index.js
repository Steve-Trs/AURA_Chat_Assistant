//index.js
import cors from "cors";
import express from "express";
import chatRoutes from "./chatRoutes.js";

const app = express();
const port = process.env.PORT || 8888;

app.use(
  cors({
    origin: "https://aura-chat-assistant.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200, // For legacy browser support
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Insta AI assistant Backend is running!");
});

app.use("/api", chatRoutes);

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
