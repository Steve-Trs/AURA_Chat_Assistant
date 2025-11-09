import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";

export const API_URL = import.meta.env.VITE_PERSONAL_API_URL;

export const useMultipleChatLogic = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  // State for dynamic prompts fetched from Supabase
  const [promptTemplates, setPromptTemplates] = useState({});
  const [selectedPrompt, setSelectedPrompt] = useState(null); // Key of the selected prompt

  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  // Derived state: Get the details of the currently selected prompt
  const currentPrompt =
    selectedPrompt && promptTemplates[selectedPrompt]
      ? promptTemplates[selectedPrompt]
      : {
          name: "Loading Assistant...",
          icon: "🤖",
          prompt: "Fetching prompt details from database...",
        };

  // --- Utility Functions ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --- Supabase and API Handlers ---

  const fetchPromptTemplates = async () => {
    try {
      // Fetch all prompts from the Supabase table 'personal_ai_prompts'
      const { data, error } = await supabase
        .from("personal_ai_prompts")
        .select("key, name, icon, prompt")
        .order("id", { ascending: true });

      if (error) throw error;

      const templatesMap = data.reduce((acc, template) => {
        acc[template.key] = {
          name: template.name,
          icon: template.icon,
          prompt: template.prompt,
        };
        return acc;
      }, {});

      setPromptTemplates(templatesMap);

      // Set the initial selected prompt to the first one loaded
      if (data.length > 0) {
        setSelectedPrompt(data[0].key);
      }
    } catch (error) {
      console.error("Error fetching prompt templates from Supabase:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(
          data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        );
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const updateConversationTitle = async (convId, newTitle) => {
    try {
      await fetch(`${API_URL}/conversations/${convId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      setConversations((prev) =>
        prev
          .map((c) => (c.id === convId ? { ...c, title: newTitle } : c))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      );
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };

  const createNewConversation = async () => {
    if (!selectedPrompt) return null;

    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_type: selectedPrompt }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConv = {
          id: data.id,
          title: data.title,
          prompt_type: data.prompt_type,
          created_at: data.created_at,
        };
        setConversations((prev) => [newConv, ...prev]);
        setSidebarOpen(false);

        return newConv.id;
      }
      return null;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  const loadConversation = async (convId) => {
    try {
      const response = await fetch(`${API_URL}/conversations/${convId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentConversationId(convId);

        // Update selected prompt state to match the conversation's prompt type
        const conv = conversations.find((c) => c.id === convId);
        if (conv && conv.prompt_type) setSelectedPrompt(conv.prompt_type);

        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const deleteConversation = async (convId) => {
    try {
      const response = await fetch(`${API_URL}/conversations/${convId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setConversations(conversations.filter((c) => c.id !== convId));
        if (currentConversationId === convId) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedPrompt) return;

    setIsLoading(true);
    let convId = currentConversationId;
    const promptDetails = currentPrompt;
    const messageToSend = inputMessage;

    // Create conversation only when sending first message
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) {
        setIsLoading(false);
        return;
      }
      //set the current conversation ID
      setCurrentConversationId(convId);
    }

    const newUserMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: messageToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");

    //Auto-title with first message
    const currentConv = conversations.find((c) => c.id === convId);
    if (currentConv && currentConv.title === "New Conversation") {
      const newTitle =
        messageToSend.length > 40
          ? messageToSend.substring(0, 40) + "..."
          : messageToSend;
      await updateConversationTitle(convId, newTitle);
    }

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          conversationId: convId,
          promptType: selectedPrompt,
          systemPrompt: promptDetails.prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Server error occurred");
      }

      const data = await response.json();
      const aiMessage = {
        id: "ai-" + Date.now(),
        role: "ai",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        id: "error-" + Date.now(),
        role: "ai",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchPromptTemplates();
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowPromptDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return {
    messages,
    setMessages,
    inputMessage,
    setInputMessage,
    isLoading,
    copiedIndex,
    conversations,
    currentConversationId,
    setCurrentConversationId,
    selectedPrompt,
    setSelectedPrompt,
    showPromptDropdown,
    setShowPromptDropdown,
    sidebarOpen,
    setSidebarOpen,
    messagesEndRef,
    dropdownRef,
    currentPrompt,
    promptTemplates,
    handleSendMessage,
    handleKeyPress,
    copyToClipboard,
    createNewConversation,
    loadConversation,
    deleteConversation,
    updateConversationTitle,
    startNewSession: startNewConversation,
  };
};
