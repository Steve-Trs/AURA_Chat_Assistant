import { Send } from "lucide-react";

const MultipleChatInput = ({ state, handlers }) => {
  const { inputMessage, isLoading } = state;
  const { setInputMessage, handleKeyPress, handleSendMessage } = handlers;

  return (
    <div className="border-t bg-white p-4">
      <div className="flex gap-3 items-end max-w-4xl mx-auto">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          rows="2"
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MultipleChatInput;
