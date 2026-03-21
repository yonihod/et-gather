"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import type { Gather } from "@/types/gather";

export function GatherHistory() {
  const t = useTranslations("gather");
  const [gathers, setGathers] = useState<Gather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("gathers")
        .select("*")
        .in("status", ["completed", "cancelled"])
        .order("completed_at", { ascending: false })
        .limit(20);

      setGathers((data as Gather[]) ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-20 bg-surface rounded-lg" />;
  }

  if (gathers.length === 0) {
    return <p className="text-muted text-sm">{t("noHistory")}</p>;
  }

  return (
    <div className="space-y-2">
      {gathers.map((g) => (
        <Link
          key={g.id}
          href={`/gather/${g.id}` as "/gather"}
          className="block bg-surface rounded-lg p-4 border border-border hover:border-accent/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${
                  g.status === "completed" ? "text-green-400" : "text-muted"
                }`}
              >
                {t(`status.${g.status}`)}
              </span>
              <span className="text-sm text-muted">
                {t(`mode.${g.mode}`)}
              </span>
            </div>
            <span className="text-xs text-muted">
              {new Date(g.completed_at || g.created_at).toLocaleDateString()}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
