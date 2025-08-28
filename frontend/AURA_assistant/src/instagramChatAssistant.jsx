import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Copy,
  Sparkles,
  Menu,
  MessageSquare,
  Lightbulb,
} from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import AddSuggestion from "./AddSuggestion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8888/api";

const InstagramChatAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddSuggestion, setShowAddSuggestion] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  ////////////////////////////////////////
  //debug logs to delete when all fixed
  // Add to the beginning of InstagramChatAssistant component
  useEffect(() => {
    console.log("Environment check:");
    console.log("VITE_API_URL from env:", import.meta.env.VITE_API_URL);
    console.log("Final API_URL being used:", API_URL);
  }, []);
  /////////////////////////////////////////

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChats();
  }, []);

  // Load all chats from backend
  const loadChats = async () => {
    try {
      console.log("Loading chats from:", `${API_URL}/chats`);
      const response = await fetch(`${API_URL}/chats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Chats loaded successfully:", data.length);
      setChats(data);
    } catch (error) {
      console.error("Error loading chats:", error);
      console.error("API_URL being used:", API_URL);
      // Optionally show user-friendly error message
      // setError("Failed to load chat history. Please try again.");
    }
  };

  // Create a new chat
  const createNewChat = async () => {
    try {
      const response = await fetch(`${API_URL}/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        const newChat = {
          id: data.id,
          title: data.title,
          created_at: data.created_at,
        };
        setChats([newChat, ...chats]);
        setCurrentChatId(newChat.id);
        setMessages([]);
        setSidebarOpen(false);
        return newChat.id;
      }
      return null;
    } catch (error) {
      console.error("Error creating new chat:", error);
      return null;
    }
  };

  // Load a specific chat
  const loadChat = async (chatId) => {
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentChatId(chatId);
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  // Update chat title
  const updateChatTitle = async (chatId, newTitle) => {
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setChats(
          chats.map((chat) =>
            chat.id === chatId ? { ...chat, title: newTitle } : chat
          )
        );
      }
    } catch (error) {
      console.error("Error updating chat title:", error);
    }
  };

  // Delete a chat
  const deleteChat = async (chatId) => {
    try {
      const response = await fetch(`${API_URL}/chats/${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChats(chats.filter((chat) => chat.id !== chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);

    let idOfCurrentChat = currentChatId;

    if (!idOfCurrentChat) {
      const newChatId = await createNewChat();
      if (newChatId) {
        idOfCurrentChat = newChatId;
      } else {
        setIsLoading(false);
        return;
      }
    }

    const newUserMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");

    const currentChat = chats.find((chat) => chat.id === idOfCurrentChat);
    if (currentChat && currentChat.title === "New Chat") {
      const newTitle =
        inputMessage.length > 30
          ? inputMessage.substring(0, 30) + "..."
          : inputMessage;
      await updateChatTitle(idOfCurrentChat, newTitle);
    }

    const conversationHistory = [...messages, newUserMessage]
      .map((msg) => {
        return `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`;
      })
      .join("\n");

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptText: newUserMessage.content,
          chatId: idOfCurrentChat,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server error occurred");
      }

      const data = await response.json();
      const aiResponse = data.response;

      const newAIMessage = {
        id: "ai-" + Date.now(),
        role: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, newAIMessage]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage = {
        id: "error-" + Date.now(),
        role: "ai",
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        createNewChat={createNewChat}
        loadChat={loadChat}
        deleteChat={deleteChat}
        updateChatTitle={updateChatTitle}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-28 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <MessageSquare className="w-6 h-6" />
              <h1 className="text-xl font-bold">Instagram Reply Assistant</h1>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddSuggestion(true)}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-colors"
                title="Add Knowledge Suggestion"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                  Suggest
                </span>
              </button>

              <button
                onClick={() => (window.location.href = "/admin/login")}
                className="text-xs text-white/70 hover:text-white"
              >
                Admin
              </button>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-1">
            Paste her Instagram message and get AI-generated reply suggestions
          </p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">
                Ready to help you reply!
              </h3>
              <p className="text-sm mb-4">
                Paste her Instagram message below to get AI-powered reply
                suggestions
              </p>
              <button
                onClick={() => setShowAddSuggestion(true)}
                className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <Lightbulb className="w-4 h-4" />
                Help improve the AI by adding suggestions
              </button>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-purple-500 text-white"
                    : "bg-white text-gray-800 border shadow-sm"
                }`}
              >
                {message.role === "user" && (
                  <div className="text-xs text-blue-100 mb-1">You:</div>
                )}
                {message.role === "ai" && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500">AI Suggestion:</div>
                    <button
                      onClick={() =>
                        copyToClipboard(message.content, message.id)
                      }
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedIndex === message.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="text-xs opacity-70 mt-2">
                  {new Date(
                    message.created_at || message.timestamp
                  ).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border shadow-sm px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">
                    Generating reply...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste her Instagram message here..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="2"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Suggestion Modal */}
      {showAddSuggestion && (
        <AddSuggestion onClose={() => setShowAddSuggestion(false)} />
      )}
    </div>
  );
};

export default InstagramChatAssistant;
