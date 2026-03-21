"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [nicknameSet, setNicknameSet] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary" />
          <div className="h-4 w-32 bg-secondary rounded" />
        </div>
      </div>
    );
  }

  if (!user && !dismissed) {
    return <LoginOverlay onDismiss={() => setDismissed(true)} />;
  }

  // User is logged in but hasn't set nickname yet
  if (user && profile && !profile.et_nickname && !nicknameSet) {
    return <NicknameSetup userId={user.id} currentName={profile.display_name} onComplete={() => { setNicknameSet(true); refreshProfile(); }} />;
  }

  return <>{children}</>;
}

function NicknameSetup({ userId, currentName, onComplete }: { userId: string; currentName: string; onComplete: () => void }) {
  const t = useTranslations("auth");
  const [nickname, setNickname] = useState(currentName);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    setSaving(true);

    const name = nickname.trim();
    await supabase
      .from("profiles")
      .update({
        display_name: name,
        et_nickname: name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);
    onComplete();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <Image
            src="/images/logo.png"
            alt="ET Gather Israel"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h1 className="font-display text-2xl font-bold">{t("setupNickname")}</h1>
          <p className="text-sm text-muted-foreground">{t("setupNicknameDesc")}</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">{t("nicknameLabel")}</label>
                <Input
                  placeholder="e.g. RoNN, WAKTAKI, Skillz..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                  maxLength={30}
                  autoFocus
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground mt-1">{t("nicknameHint")}</p>
              </div>

              <Button type="submit" disabled={saving || !nickname.trim()} className="w-full">
                {saving ? "..." : t("saveAndContinue")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <button
          onClick={onComplete}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          {t("skipForNow")}
        </button>
      </div>
    </div>
  );
}

function LoginOverlay({ onDismiss }: { onDismiss: () => void }) {
  const t = useTranslations("auth");
  const tHome = useTranslations("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      window.location.reload();
    }
    setSubmitLoading(false);
  }

  async function handleDiscordLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <Image
            src="/images/logo.png"
            alt="ET Gather Israel"
            width={120}
            height={120}
            className="mx-auto"
            priority
          />
          <h1 className="text-3xl font-bold">
            <span className="text-primary">ET</span> Gather
          </h1>
          <p className="text-sm text-muted-foreground">{tHome("subtitle")}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <Button
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
              onClick={handleDiscordLogin}
            >
              <svg className="w-5 h-5 me-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              {t("loginWith", { provider: "Discord" })}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">{t("orContinueWith")}</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <Input type="email" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input type="password" placeholder={t("password")} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" disabled={submitLoading} className="w-full">
                {submitLoading ? "..." : isSignUp ? t("signUp") : t("login")}
              </Button>
            </form>

            <button onClick={() => setIsSignUp(!isSignUp)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
              {isSignUp ? t("login") : t("signUp")}
            </button>
          </CardContent>
        </Card>

        <button onClick={onDismiss} className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2">
          {t("continueAnonymously")}
        </button>
      </div>
    </div>
  );
}
