import { Sparkles, ChevronDown, Menu } from "lucide-react";

const MultipleChatHeader = ({ state, handlers }) => {
  const {
    currentConversationId,
    selectedPrompt,
    showPromptDropdown,
    dropdownRef,
    currentPrompt,
    promptTemplates,
  } = state;
  const { setSelectedPrompt, setShowPromptDropdown, setSidebarOpen } = handlers;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Personal AI Assistant
              </h1>
              <p className="text-xs text-gray-500">Powered by Gemini Pro</p>
            </div>
          </div>

          {/* Prompt Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowPromptDropdown(!showPromptDropdown)}
              disabled={
                currentConversationId !== null ||
                Object.keys(promptTemplates).length === 0
              }
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-lg">{currentPrompt.icon}</span>
              <span className="text-sm font-medium hidden sm:inline">
                {currentPrompt.name}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showPromptDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                {Object.entries(promptTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPrompt(key);
                      setShowPromptDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                      selectedPrompt === key ? "bg-blue-50" : ""
                    }`}
                  >
                    <span className="text-xl">{template.icon}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleChatHeader;
