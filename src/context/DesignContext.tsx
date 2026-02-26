import { fetchCustomDesignUrl, fetchFooter, saveFooter } from '@/src/services/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

type DesignType = 'default' | 'custom';

interface DesignContextType {
  selectedDesign: DesignType;
  setSelectedDesign: (design: DesignType) => void;
  customDesignUrl: string | null;
  setCustomDesignUrl: (url: string | null) => void;
  loadingCustomDesign: boolean;
  refreshCustomDesign: () => Promise<void>;
  footerText: string;
  setFooterText: (text: string) => void;
  loadingFooter: boolean;
  refreshFooter: () => Promise<void>;
  saveFooterText: (text: string) => Promise<void>;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [selectedDesign, setSelectedDesign] = useState<DesignType>('default');
  const [customDesignUrl, setCustomDesignUrl] = useState<string | null>(null);
  const [loadingCustomDesign, setLoadingCustomDesign] = useState(false);
  const [footerText, setFooterText] = useState('');
  const [loadingFooter, setLoadingFooter] = useState(false);

  const refreshCustomDesign = React.useCallback(async () => {
    setLoadingCustomDesign(true);
    try {
      const url = await fetchCustomDesignUrl();
      // Always update state - React will handle re-render optimization
      setCustomDesignUrl((currentUrl) => {
        // Only log if URL actually changed
        if (url !== currentUrl) {
          if (url) {
            console.log('[DesignContext] Custom design image_url:', url);
          } else {
            console.log('[DesignContext] No custom design found for user');
          }
        }
        return url;
      });
    } catch (error) {
      console.warn('[DesignContext] Error loading custom design (may be normal if endpoint not deployed):', error);
      setCustomDesignUrl((currentUrl) => {
        // Only set to null if it's not already null
        return currentUrl !== null ? null : currentUrl;
      });
    } finally {
      setLoadingCustomDesign(false);
    }
  }, []);

  const refreshFooter = React.useCallback(async () => {
    setLoadingFooter(true);
    try {
      const footer = await fetchFooter();
      setFooterText(footer);
      console.log('[DesignContext] Footer loaded:', footer);
    } catch (error) {
      console.warn('[DesignContext] Error loading footer:', error);
      setFooterText('');
    } finally {
      setLoadingFooter(false);
    }
  }, []);

  const saveFooterText = React.useCallback(async (text: string) => {
    try {
      await saveFooter(text);
      setFooterText(text);
      console.log('[DesignContext] Footer saved successfully');
    } catch (error) {
      console.error('[DesignContext] Error saving footer:', error);
      throw error;
    }
  }, []);

  // Load custom design and footer on mount
  useEffect(() => {
    refreshCustomDesign();
    refreshFooter();
  }, [refreshCustomDesign, refreshFooter]);

  return (
    <DesignContext.Provider
      value={{
        selectedDesign,
        setSelectedDesign,
        customDesignUrl,
        setCustomDesignUrl,
        loadingCustomDesign,
        refreshCustomDesign,
        footerText,
        setFooterText,
        loadingFooter,
        refreshFooter,
        saveFooterText,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
}
