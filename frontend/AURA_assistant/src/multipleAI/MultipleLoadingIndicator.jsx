const MultipleLoadingIndicator = () => (
  <div className="flex justify-start">
    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
        <span className="text-sm text-gray-500">Thinking...</span>
      </div>
    </div>
  </div>
);

export default MultipleLoadingIndicator;
