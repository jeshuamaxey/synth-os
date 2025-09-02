"use client"

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useCaptcha } from "./captcha-context";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { isCaptchaSolved, captchaToken } = useCaptcha();
  
  useEffect(() => {
    // Wait for CAPTCHA to be solved before attempting authentication
    if (!isCaptchaSolved) {
      console.log('AuthBootstrap: Waiting for CAPTCHA to be solved...');
      return;
    }

    console.log('AuthBootstrap: CAPTCHA solved, proceeding with authentication...');
    
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
    } catch {
      console.log('AuthBootstrap error');
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data, error } = await supabase.auth.signInAnonymously({
              options: {
                captchaToken: captchaToken
              }
            });
            if (!error && data.session) {

              break;
            }
            if (cancelled) {

              return;
            }

            await wait(300 * (attempt + 1));
          }
        }
        else {

        }
      } catch (error) {
        // silent – bootstrap should be invisible
        console.error('Error signing in anonymously', error);
      } 
    })();
    return () => {
      cancelled = true;
    };
  }, [isCaptchaSolved, captchaToken]);

  return <>{children}</>;
} 