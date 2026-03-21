"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import type { Profile, AttendanceStats, Gather } from "@/types/gather";

export function ProfileView({ userId }: { userId: string }) {
  const t = useTranslations("profile");
  const { refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recentGathers, setRecentGathers] = useState<Gather[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsOwner(user?.id === userId);

      const [profileRes, statsRes, gathersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("attendance_stats").select("*").eq("user_id", userId).single(),
        supabase
          .from("gather_participants")
          .select("gather:gathers(*)")
          .eq("user_id", userId)
          .order("joined_at", { ascending: false })
          .limit(10),
      ]);

      const p = profileRes.data as Profile | null;
      setProfile(p);
      if (p) {
        setEditName(p.display_name);
        setEditNickname(p.et_nickname || "");
      }
      setStats(statsRes.data as AttendanceStats | null);
      setRecentGathers(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (gathersRes.data?.map((d: any) => d.gather) as Gather[]) ?? []
      );
      setLoading(false);
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        display_name: editName.trim() || profile.display_name,
        et_nickname: editNickname.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setProfile({
      ...profile,
      display_name: editName.trim() || profile.display_name,
      et_nickname: editNickname.trim() || null,
    });
    setSaving(false);
    setEditing(false);
    refreshProfile();
  }

  if (loading) return <div className="animate-pulse h-40 bg-card rounded-lg" />;
  if (!profile) return <p className="text-muted-foreground">Player not found</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          {editing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl font-bold">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold">{t("editProfile")}</h2>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("etNickname")}</label>
                <Input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="e.g. RoNN, WAKTAKI..."
                  dir="ltr"
                  maxLength={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("displayName")}</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={profile.display_name}
                  maxLength={50}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? "..." : t("save")}
                </Button>
                <Button onClick={() => setEditing(false)} variant="ghost" size="sm">
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl font-bold">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl font-bold">{profile.display_name}</h1>
                  {profile.et_nickname && (
                    <p className="text-sm text-muted-foreground">
                      {t("etNickname")}: <span dir="ltr" className="inline-block">{profile.et_nickname}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("memberSince")} {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {isOwner && (
                <Button onClick={() => setEditing(true)} variant="ghost" size="sm">
                  {t("editProfile")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.total_gathers ?? 0}</div>
            <div className="text-sm text-muted-foreground">{t("totalGathers")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats?.attendance_points ?? 0}</div>
            <div className="text-sm text-muted-foreground">{t("attendancePoints")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent gathers */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentGathers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentGathers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No gathers yet</p>
          ) : (
            <div className="space-y-2">
              {recentGathers.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-2">
                    <Badge variant={g.status === "completed" ? "default" : "outline"}>{g.status}</Badge>
                    <span className="text-sm text-muted-foreground">{g.mode}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(g.completed_at || g.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
