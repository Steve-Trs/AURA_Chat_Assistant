import MultipleChatSideBar from "./MultipleChatSideBar.jsx";
import MultipleChatHeader from "./MultipleChatHeader.jsx";
import MultipleChatMessages from "./MultipleChatMessages.jsx";
import MultipleChatInput from "./MultipleChatInput.jsx";

const MultipleChatLayout = ({ state, handlers }) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <MultipleChatSideBar state={state} handlers={handlers} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <MultipleChatHeader state={state} handlers={handlers} />

        {/* Messages */}
        <MultipleChatMessages state={state} handlers={handlers} />

        {/* Input */}
        <MultipleChatInput state={state} handlers={handlers} />
      </div>
    </div>
  );
};

export default MultipleChatLayout;
