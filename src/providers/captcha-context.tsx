"use client"

import { createContext, useContext, useState, ReactNode } from 'react';

interface CaptchaContextType {
  isCaptchaSolved: boolean;
  captchaToken: string | undefined;
  setCaptchaSolved: (solved: boolean) => void;
  setCaptchaToken: (token: string) => void;
}

const CaptchaContext = createContext<CaptchaContextType | undefined>(undefined);

export function CaptchaProvider({ children }: { children: ReactNode }) {
  const [isCaptchaSolved, setIsCaptchaSolved] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | undefined>(undefined);

  const setCaptchaSolved = (solved: boolean) => {
    setIsCaptchaSolved(solved);
  };

  const setCaptchaTokenValue = (token: string) => {
    setCaptchaToken(token);
  };

  return (
    <CaptchaContext.Provider value={{ 
      isCaptchaSolved, 
      captchaToken, 
      setCaptchaSolved, 
      setCaptchaToken: setCaptchaTokenValue 
    }}>
      {children}
    </CaptchaContext.Provider>
  );
}

export function useCaptcha() {
  const context = useContext(CaptchaContext);
  if (context === undefined) {
    throw new Error('useCaptcha must be used within a CaptchaProvider');
  }
  return context;
}
