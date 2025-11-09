import { Trash2, Plus, X } from "lucide-react";

const MultipleChatSidebar = ({ state, handlers }) => {
  const { conversations, currentConversationId, sidebarOpen, promptTemplates } =
    state;
  const {
    startNewSession,
    loadConversation,
    deleteConversation,
    setSidebarOpen,
  } = handlers;

  return (
    <div
      className={`${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-30 flex flex-col`}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Conversations</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={startNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
              currentConversationId === conv.id
                ? "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
            onClick={() => loadConversation(conv.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {promptTemplates[conv.prompt_type]?.icon || "💬"}
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {conv.title}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(conv.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultipleChatSidebar;
