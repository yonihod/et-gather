"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, AttendanceStats, Gather } from "@/types/gather";

export function ProfileView({ userId }: { userId: string }) {
  const t = useTranslations("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recentGathers, setRecentGathers] = useState<Gather[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();

      const [profileRes, statsRes, gathersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("attendance_stats")
          .select("*")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("gather_participants")
          .select("gather:gathers(*)")
          .eq("user_id", userId)
          .order("joined_at", { ascending: false })
          .limit(10),
      ]);

      setProfile(profileRes.data as Profile | null);
      setStats(statsRes.data as AttendanceStats | null);
      setRecentGathers(
        (gathersRes.data?.map((d: { gather: Gather }) => d.gather) as Gather[]) ?? []
      );
      setLoading(false);
    }
    fetch();
  }, [userId]);

  if (loading) {
    return <div className="animate-pulse h-40 bg-surface rounded-lg" />;
  }

  if (!profile) {
    return <p className="text-muted">Player not found</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="bg-surface rounded-lg border border-border p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold">{profile.display_name}</h1>
          {profile.et_nickname && (
            <p className="text-sm text-muted">
              {t("etNickname")}: {profile.et_nickname}
            </p>
          )}
          <p className="text-xs text-muted mt-1">
            {t("memberSince")}{" "}
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface rounded-lg border border-border p-4 text-center">
          <div className="text-2xl font-bold text-accent">
            {stats?.total_gathers ?? 0}
          </div>
          <div className="text-sm text-muted">{t("totalGathers")}</div>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4 text-center">
          <div className="text-2xl font-bold text-accent">
            {stats?.attendance_points ?? 0}
          </div>
          <div className="text-sm text-muted">{t("attendancePoints")}</div>
        </div>
      </div>

      {/* Recent gathers */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t("recentGathers")}</h2>
        {recentGathers.length === 0 ? (
          <p className="text-muted text-sm">No gathers yet</p>
        ) : (
          <div className="space-y-2">
            {recentGathers.map((g) => (
              <div
                key={g.id}
                className="bg-surface rounded-lg border border-border p-3 flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      g.status === "completed"
                        ? "text-green-400"
                        : "text-muted"
                    }
                  >
                    {g.status}
                  </span>
                  <span className="text-muted">{g.mode}</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(
                    g.completed_at || g.created_at
                  ).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
