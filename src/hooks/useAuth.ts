"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/gather";

const supabase = createClient();

// Shared state so all components using useAuth see the same data
let listeners: Array<() => void> = [];
let cachedUser: User | null = null;
let cachedProfile: Profile | null = null;
let initialized = false;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data as Profile | null;
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export function useAuth() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.push(listener);

    if (!initialized) {
      initialized = true;
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        cachedUser = user;
        if (user) {
          cachedProfile = await fetchProfile(user.id);
        }
        notifyListeners();
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        cachedUser = session?.user ?? null;
        if (!session?.user) {
          cachedProfile = null;
          notifyListeners();
        }
      });
    }

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (cachedUser) {
      cachedProfile = await fetchProfile(cachedUser.id);
      notifyListeners();
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    cachedUser = null;
    cachedProfile = null;
    notifyListeners();
    window.location.href = "/";
  }, []);

  return {
    user: cachedUser,
    profile: cachedProfile,
    loading: !initialized,
    signOut,
    refreshProfile,
  };
}
