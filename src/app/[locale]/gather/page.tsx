"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { GatherQueue } from "@/components/gather/GatherQueue";
import { GatherHistory } from "@/components/gather/GatherHistory";

export default function GatherPage() {
  const t = useTranslations("gather");
  const [activeTab, setActiveTab] = useState<"lobby" | "history">("lobby");

  return (
    <div className="space-y-6 topo-grid -mx-4 sm:-mx-6 px-4 sm:px-6 py-2">
      <div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">{t("title")}</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("lobby")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "lobby"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("lobby")}
          {activeTab === "lobby" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === "history"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("history")}
          {activeTab === "history" && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "lobby" ? (
        <GatherQueue />
      ) : (
        <GatherHistory />
      )}
    </div>
  );
}
