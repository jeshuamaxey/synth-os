"use client"

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // If URL contains auth-related params from an email link, set a one-time flag to skip boot
    try {
      const url = new URL(window.location.href);
      const hasAuthParams =
        url.searchParams.has("code") ||
        url.searchParams.has("token_hash") ||
        url.searchParams.get("type") === "magiclink" ||
        url.hash.includes("access_token=");
      if (hasAuthParams) {
        window.sessionStorage.setItem("skipBootOnce", "1");
      }
    } catch {}

    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error } = await supabase.auth.signInAnonymously();
            if (!error && data.session) break;
            if (cancelled) return;
            await wait(300 * (attempt + 1));
          }
        }
      } catch {
        // silent – bootstrap should be invisible
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
} 