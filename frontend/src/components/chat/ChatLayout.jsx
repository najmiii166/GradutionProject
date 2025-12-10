// frontend/src/components/chat/ChatLayout.jsx
import React from "react";
import ChatSidebar from "./ChatSidebar";
import ChatWindow from "./ChatWindow";

export default function ChatLayout({
  conversations = [],
  messages = [],
  activeConversationId,
  onSelectConversation,
  onSendMessage,
  query,
  onQueryChange,
  role,
  user,
  serverOrigin,
  loadingMsgs,
}) {
  return (
    <div className="h-screen bg-slate-900 text-white grid grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)]">
      <ChatSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={onSelectConversation}
        query={query}
        onQueryChange={onQueryChange}
        role={role}
      />
      <ChatWindow
        user={user}
        serverOrigin={serverOrigin}
        messages={messages}
        loading={loadingMsgs}
        onSendText={(text) => onSendMessage && onSendMessage({ text })}
        onSendFile={(file) => onSendMessage && onSendMessage({ file })}
      />
    </div>
  );
}