//index.js
import cors from "cors";
import express from "express";
import chatRoutes from "./chatRoutes.js";

const app = express();
const port = process.env.PORT || 8888;
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Insta AI assistant Backend is running!");
});

app.use("/api", chatRoutes);

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
