"use client";

import { useAuth } from "@/hooks/useAuth";
import { ChatPage } from "@/components/chat/ChatPage";

export default function MuridChatPage() {
  const { user } = useAuth("murid");
  return <ChatPage currentUserId={user?.id} />;
}
