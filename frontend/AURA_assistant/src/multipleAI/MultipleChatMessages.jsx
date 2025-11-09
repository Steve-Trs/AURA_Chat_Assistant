import { Copy, Check } from "lucide-react";
import MultipleLoadingIndicator from "./MultipleLoadingIndicator";

const MultipleChatMessages = ({ state, handlers }) => {
  const { messages, isLoading, copiedIndex, messagesEndRef, currentPrompt } =
    state;
  const { copyToClipboard } = handlers;

  // --- Initial State Message Component ---
  const InitialMessage = () => (
    <div className="text-center mt-20">
      <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
        <span className="text-4xl">{currentPrompt.icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {currentPrompt.name}
      </h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
        {currentPrompt.prompt}
      </p>
      <p className="text-xs text-gray-500">Start a conversation below!</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && <InitialMessage />}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-3xl px-4 py-3 rounded-2xl ${
              message.role === "user"
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                : "bg-white text-gray-800 shadow-sm border border-gray-200"
            }`}
          >
            {message.role === "ai" && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">AI Response</span>
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {copiedIndex === message.id ? (
                    <>
                      <Check className="w-3 h-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            )}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
            <div
              className={`text-xs mt-2 ${
                message.role === "user" ? "text-white/70" : "text-gray-400"
              }`}
            >
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      ))}

      {isLoading && <MultipleLoadingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MultipleChatMessages;
