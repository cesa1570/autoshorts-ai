import React, { createContext, useContext } from 'react';

export interface AppContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  resetKeyStatus: () => void;
  hasSelectedKey: boolean;
  userTier: 'standard' | 'pro';
  setUserTier: (tier: 'standard' | 'pro') => void;
  dailyTokens: number;
  apiRequestsToday: number;
  usageHistory: UsageRecord[];

  // Multi-Key Support
  apiKeys: string[];
  addApiKey: (key: string) => void;
  removeApiKey: (key: string) => void;

  // OpenAI Support
  openaiApiKey: string;
  setOpenaiApiKey: (key: string) => void;

  // Auth & License Support
  userId: string | null;
  setUserId: (id: string | null) => void;
  licenseTier: 'free' | 'pro' | 'enterprise';
  setLicenseTier: (tier: 'free' | 'pro' | 'enterprise') => void;
  licenseExpiresAt: number | null;
  setLicenseExpiresAt: (expiresAt: number | null) => void;

  // Vertex AI Support
  vertexProjectId: string;
  setVertexProjectId: (id: string) => void;
  vertexLocation: string;
  setVertexLocation: (loc: string) => void;
  vertexServiceKey: string;
  setVertexServiceKey: (key: string) => void;
  vertexApiKey: string;
  setVertexApiKey: (key: string) => void;
}

export interface UsageRecord {
  timestamp: number;
  date: string;
  model: string;
  tokens: number;
  cost?: number; // Cost in USD
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};