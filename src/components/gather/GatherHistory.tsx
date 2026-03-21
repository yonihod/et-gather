"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  if (loading) return <div className="skeleton-scan h-20 rounded-lg" />;
  if (gathers.length === 0) return <p className="text-muted-foreground text-sm">{t("noHistory")}</p>;

  return (
    <div className="space-y-2">
      {gathers.map((g, i) => (
        <Link key={g.id} href={`/gather/${g.id}` as "/gather"} className="block">
          <Card className={`hover:border-primary/30 transition-colors animate-row-enter ${
            g.status === "completed" ? "card-completed" : "card-cancelled"
          } ${i % 2 === 1 ? "bg-secondary/20" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={g.status === "completed" ? "default" : "outline"}>
                  {t(`status.${g.status}`)}
                </Badge>
                <span className="text-sm text-muted-foreground">{t(`mode.${g.mode}`)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(g.completed_at || g.created_at).toLocaleDateString()}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
