import { useMultipleChatLogic } from "./useMultipleChatHooks";
import MultipleChatLayout from "./MultipleChatLayout";

const MultiplePersonalAIChat = () => {
  const chatLogic = useMultipleChatLogic();

  // Separate state and handlers for clean passing to layout
  const state = {
    messages: chatLogic.messages,
    inputMessage: chatLogic.inputMessage,
    isLoading: chatLogic.isLoading,
    copiedIndex: chatLogic.copiedIndex,
    conversations: chatLogic.conversations,
    currentConversationId: chatLogic.currentConversationId,
    selectedPrompt: chatLogic.selectedPrompt,
    showPromptDropdown: chatLogic.showPromptDropdown,
    sidebarOpen: chatLogic.sidebarOpen,
    messagesEndRef: chatLogic.messagesEndRef,
    dropdownRef: chatLogic.dropdownRef,
    currentPrompt: chatLogic.currentPrompt,
    promptTemplates: chatLogic.promptTemplates,
  };

  const handlers = {
    setInputMessage: chatLogic.setInputMessage,
    handleKeyPress: chatLogic.handleKeyPress,
    handleSendMessage: chatLogic.handleSendMessage,
    copyToClipboard: chatLogic.copyToClipboard,
    startNewSession: chatLogic.startNewSession,
    loadConversation: chatLogic.loadConversation,
    deleteConversation: chatLogic.deleteConversation,
    setSelectedPrompt: chatLogic.setSelectedPrompt,
    setShowPromptDropdown: chatLogic.setShowPromptDropdown,
    setSidebarOpen: chatLogic.setSidebarOpen,
  };

  return <MultipleChatLayout state={state} handlers={handlers} />;
};

export default MultiplePersonalAIChat;
