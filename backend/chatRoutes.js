import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables.");
  throw new Error("Supabase environment variables are required");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing");
  throw new Error("Gemini API key is required");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to get the current active prompt from the database
const getActivePrompt = async () => {
  try {
    const { data, error } = await supabase
      .from("prompts")
      .select("content")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching prompt:", error);
      return "You are an Instagram talent scout for AURA Modeling. Be friendly and helpful.";
    }

    return data.content;
  } catch (error) {
    console.error("Error in getActivePrompt:", error);
    return "You are an Instagram talent scout for AURA Modeling. Be friendly and helpful.";
  }
};

// Function to build an enhanced prompt with approved instructions AND suggestions
const buildEnhancedPrompt = async () => {
  try {
    let enhancedPrompt = await getActivePrompt();

    // 1. Get and append approved instructions
    const { data: instructions, error: instructionsError } = await supabase
      .from("instructions")
      .select("content")
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (!instructionsError && instructions && instructions.length > 0) {
      enhancedPrompt += "\n\n--- Additional Instructions from Admin ---\n\n";
      instructions.forEach((instruction) => {
        enhancedPrompt += `* ${instruction.content}\n`;
      });
    }

    // 2. Get and append approved suggestions (Q&A)
    const { data: suggestions, error: suggestionsError } = await supabase
      .from("suggestions")
      .select("question, suggested_reply")
      .eq("status", "approved")
      .order("approved_at", { ascending: true });

    if (!suggestionsError && suggestions && suggestions.length > 0) {
      enhancedPrompt +=
        "\n\n--- Additional Knowledge from User Suggestions ---\n\n";
      suggestions.forEach((suggestion, index) => {
        enhancedPrompt += `${index + 1}. **If they ask "${
          suggestion.question
        }":**\n`;
        enhancedPrompt += `   Suggested Response: "${suggestion.suggested_reply}"\n\n`;
      });
    }

    console.log("Final enhanced prompt length:", enhancedPrompt.length);
    console.log("Final enhanced prompt :", enhancedPrompt);
    return enhancedPrompt;
  } catch (error) {
    console.error("Error building enhanced prompt:", error);
    return await getActivePrompt();
  }
};

//
// Main chat endpoint to get AI response
//
router.post("/chat", async (req, res) => {
  try {
    const { promptText, chatId, conversationHistory } = req.body;
    if (!promptText || !chatId) {
      return res
        .status(400)
        .json({ error: "Prompt text and chat ID are required." });
    }

    await supabase.from("messages").insert({
      chat_id: chatId,
      content: promptText,
      role: "user",
    });

    const masterPrompt = await buildEnhancedPrompt();
    const fullPrompt = `${masterPrompt}\n\nChat History:\n${conversationHistory}\n\nUser's Latest Query: ${promptText}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const aiResponseText = response.text();

    await supabase.from("messages").insert({
      chat_id: chatId,
      content: aiResponseText,
      role: "ai",
    });

    res.status(200).json({ response: aiResponseText });
  } catch (error) {
    console.error("Error processing chat request:", error);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});

//
// Admin-related endpoints
//
//
// Endpoint to update the master prompt
//
router.put("/prompt", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Prompt content is required." });
    }

    const { error: deactivateError } = await supabase
      .from("prompts")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Error deactivating old prompt:", deactivateError);
    }

    const { data, error: insertError } = await supabase
      .from("prompts")
      .insert({ content, is_active: true })
      .select("id, content, created_at");

    if (insertError) throw insertError;
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error updating prompt:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the prompt." });
  }
});

//
// Endpoint to add a new suggestion
//
router.post("/suggestions", async (req, res) => {
  try {
    const { question, suggested_reply, created_by } = req.body;

    if (!question || !suggested_reply) {
      return res.status(400).json({
        error: "Question and suggested reply are required.",
      });
    }

    const { data, error } = await supabase
      .from("suggestions")
      .insert({
        question: question.trim(),
        suggested_reply: suggested_reply.trim(),
        created_by: created_by || "anonymous",
      })
      .select("id, question, suggested_reply, status, created_at");

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating suggestion:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the suggestion." });
  }
});

//
// Endpoint to add a new instruction
//
router.post("/instructions", async (req, res) => {
  try {
    const { content, created_by } = req.body;
    if (!content) {
      return res
        .status(400)
        .json({ error: "Instruction content is required." });
    }

    const { data, error } = await supabase
      .from("instructions")
      .insert({
        content: content.trim(),
        status: "pending",
        created_by: created_by || "anonymous",
      })
      .select("id, content, status, created_at");

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating instruction:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the instruction." });
  }
});

//
// Endpoint to get all suggestions
//
router.get("/suggestions", async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching suggestions." });
  }
});

//
// Endpoint to get all instructions
//
router.get("/instructions", async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from("instructions")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching instructions:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching instructions." });
  }
});

//
// Endpoint to approve/reject a suggestion
//
router.put("/suggestions/:suggestionId", async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { status, approved_by } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Status must be either 'approved' or 'rejected'.",
      });
    }

    const updateData = {
      status,
      approved_at: new Date().toISOString(),
    };

    if (approved_by) {
      updateData.approved_by = approved_by;
    }

    const { data, error } = await supabase
      .from("suggestions")
      .update(updateData)
      .eq("id", suggestionId)
      .select("*");

    if (error) throw error;
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error updating suggestion:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the suggestion." });
  }
});

//
// Endpoint to approve/reject an instruction
//
router.put("/instructions/:instructionId", async (req, res) => {
  try {
    const { instructionId } = req.params;
    const { status, approved_by } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: "Status must be either 'approved' or 'rejected'.",
      });
    }

    const updateData = {
      status,
      approved_at: new Date().toISOString(),
    };

    if (approved_by) {
      updateData.approved_by = approved_by;
    }

    const { data, error } = await supabase
      .from("instructions")
      .update(updateData)
      .eq("id", instructionId)
      .select("*");

    if (error) throw error;
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error updating instruction:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the instruction." });
  }
});

//
// User/UI related Endpoints
//
//
//Endpoint to get all chats (chat history)
//
router.get("/chats", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chats")
      .select("id, title, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "An error occurred while fetching chats." });
  }
});

//
//Endpoint to create a new chat
//
router.post("/chats", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("chats")
      .insert({})
      .select("id, title, created_at");

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error creating new chat:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating a new chat." });
  }
});

//
//Endpoint to get all messages for a specific chat
//
router.get("/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { data, error } = await supabase
      .from("messages")
      .select("id, content, role, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.status(200).json({ messages: data });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching messages." });
  }
});

//
//Endpoint to update a chat's title
//
router.put("/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const { data, error } = await supabase
      .from("chats")
      .update({ title })
      .eq("id", chatId)
      .select("id, title");

    if (error) throw error;
    res.status(200).json(data[0]);
  } catch (error) {
    console.error("Error updating chat title:", error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the chat title." });
  }
});

//
//Endpoint to delete a chat
//
router.delete("/chats/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { error } = await supabase.from("chats").delete().eq("id", chatId);
    if (error) throw error;
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting chat:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the chat." });
  }
});

export default router;
