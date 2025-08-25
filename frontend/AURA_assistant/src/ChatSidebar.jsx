import React, { useState } from "react";
import { Plus, MessageSquare, X, Edit3, Trash2 } from "lucide-react";

const ChatSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  chats,
  currentChatId,
  createNewChat,
  loadChat,
  deleteChat,
  updateChatTitle,
}) => {
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");

  const startEditing = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const saveEditedTitle = async (chatId) => {
    if (editingTitle.trim()) {
      await updateChatTitle(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transition-transform duration-300 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="h-28 p-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Chat History</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={createNewChat}
              className="mt-3 w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No chats yet</p>
              </div>
            ) : (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                      currentChatId === chat.id
                        ? "bg-purple-50 border-l-4 border-purple-500"
                        : ""
                    }`}
                  >
                    <div onClick={() => loadChat(chat.id)} className="flex-1">
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => saveEditedTitle(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEditedTitle(chat.id);
                            if (e.key === "Escape") cancelEditing();
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm border rounded"
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="font-medium text-sm text-gray-900 mb-1">
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(chat.created_at).toLocaleDateString()}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(chat.id, chat.title);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit3 className="w-3 h-3 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default ChatSidebar;
