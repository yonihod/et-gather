"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GatherMessage } from "@/types/gather";

export function GatherChat({ gatherId, userId }: { gatherId: string; userId: string }) {
  const t = useTranslations("gather");
  const [messages, setMessages] = useState<GatherMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    // Fetch existing messages
    async function fetchMessages() {
      const { data } = await supabase
        .from("gather_messages")
        .select("*, profile:profiles(id, display_name, avatar_url)")
        .eq("gather_id", gatherId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as GatherMessage[]);
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`gather-chat-${gatherId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gather_messages",
          filter: `gather_id=eq.${gatherId}`,
        },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from("gather_messages")
            .select("*, profile:profiles(id, display_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => [...prev, data as GatherMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gatherId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    await supabase.from("gather_messages").insert({
      gather_id: gatherId,
      user_id: userId,
      content,
    });

    setSending(false);
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
        {t("chat")}
      </h4>

      {/* Messages */}
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3 scrollbar-thin">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground/50 italic text-center py-4">
            No messages yet
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.user_id === userId;
          const name = msg.profile?.display_name || "Player";
          const time = new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex gap-2 text-sm animate-fade-up ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <div className={`max-w-[80%] ${isOwn ? "text-end" : ""}`}>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xs font-medium ${isOwn ? "text-primary" : "text-muted-foreground"}`}>
                    {name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">{time}</span>
                </div>
                <p className={`text-sm mt-0.5 px-3 py-1.5 rounded-lg inline-block ${
                  isOwn
                    ? "bg-primary/10 text-foreground"
                    : "bg-secondary text-foreground"
                }`}>
                  {msg.content}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder")}
          maxLength={500}
          className="flex-1 h-9 text-sm"
          disabled={sending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || !input.trim()}
          className="h-9 px-4"
        >
          {t("send")}
        </Button>
      </form>
    </div>
  );
}
