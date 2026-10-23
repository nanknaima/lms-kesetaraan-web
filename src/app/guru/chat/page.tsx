"use client";

import { useAuth } from "@/hooks/useAuth";
import { ChatPage } from "@/components/chat/ChatPage";

export default function GuruChatPage() {
  const { user } = useAuth("guru");
  return <ChatPage currentUserId={user?.id} />;
}
