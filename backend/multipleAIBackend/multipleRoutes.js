import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// ==========================================
// AUTHENTICATION ENDPOINT
// ==========================================

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Authentication error:", error);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if user has super_admin role in metadata
    const userRole = data.user.user_metadata?.role;

    if (userRole !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Access denied - insufficient permissions" });
    }

    // Return success with user data and session
    res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

// Verify session endpoint
router.post("/auth/verify", async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data, error } = await supabase.auth.getUser(access_token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    // Check if user has super_admin role
    const userRole = data.user.user_metadata?.role;

    if (userRole !== "super_admin") {
      return res
        .status(403)
        .json({ error: "Access denied - insufficient permissions" });
    }

    res.status(200).json({
      valid: true,
      user: {
        ...data.user,
        role: userRole,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "An error occurred during verification" });
  }
});

// Logout endpoint
router.post("/auth/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "An error occurred during logout" });
  }
});

// ==========================================
// CONVERSATIONS ENDPOINTS
// ==========================================

router.get("/conversations", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("personal_conversations")
      .select("id, title, prompt_type, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Error fetching conversations" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { prompt_type = "general" } = req.body;

    const { data, error } = await supabase
      .from("personal_conversations")
      .insert({ prompt_type })
      .select("id, title, prompt_type, created_at");

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Error creating conversation" });
  }
});

router.get("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { data, error } = await supabase
      .from("personal_messages")
      .select("id, content, role, timestamp")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true });

    if (error) throw error;
    res.status(200).json({ messages: data });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Error fetching messages" });
  }
});

router.put("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;

    const { data, error } = await supabase
      .from("personal_conversations")
      .update({ title })
      .eq("id", conversationId)
      .select("id, title");

    if (error) throw error;
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error updating title:", error);
    res.status(500).json({ error: "Error updating title" });
  }
});

router.delete("/conversations/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Delete messages first
    await supabase
      .from("personal_messages")
      .delete()
      .eq("conversation_id", conversationId);

    // Delete conversation
    const { error } = await supabase
      .from("personal_conversations")
      .delete()
      .eq("id", conversationId);

    if (error) throw error;
    res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ error: "Error deleting conversation" });
  }
});

// ==========================================
// CHAT ENDPOINT
// ==========================================

router.post("/chat", async (req, res) => {
  try {
    const { message, conversationId, promptType, systemPrompt } = req.body;

    if (!message || !conversationId) {
      return res
        .status(400)
        .json({ error: "Message and conversation ID required" });
    }

    // Save user message
    await supabase.from("personal_messages").insert({
      conversation_id: conversationId,
      content: message,
      role: "user",
    });

    // Get conversation history (last 20 messages)
    const { data: historyData } = await supabase
      .from("personal_messages")
      .select("content, role")
      .eq("conversation_id", conversationId)
      .order("timestamp", { ascending: true })
      .limit(20);

    // Build conversation context
    const conversationHistory = historyData
      .map(
        (msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
      )
      .join("\n");

    // Use the systemPrompt from frontend (from Supabase ai_prompts table)
    const fullPrompt = `${systemPrompt}

Previous conversation:
${conversationHistory}

User: ${message}`;

    // Get AI response from Gemini Pro
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponseText = response.text();

    // Save AI message
    await supabase.from("personal_messages").insert({
      conversation_id: conversationId,
      content: aiResponseText,
      role: "ai",
    });

    res.status(200).json({ response: aiResponseText });
  } catch (error) {
    console.error("Error processing chat:", error);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
});

export default router;
