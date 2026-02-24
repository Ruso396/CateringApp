import { fetchCustomDesignUrl } from '@/src/services/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

type DesignType = 'default' | 'custom';

interface DesignContextType {
  selectedDesign: DesignType;
  setSelectedDesign: (design: DesignType) => void;
  customDesignUrl: string | null;
  setCustomDesignUrl: (url: string | null) => void;
  loadingCustomDesign: boolean;
  refreshCustomDesign: () => Promise<void>;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [selectedDesign, setSelectedDesign] = useState<DesignType>('default');
  const [customDesignUrl, setCustomDesignUrl] = useState<string | null>(null);
  const [loadingCustomDesign, setLoadingCustomDesign] = useState(false);

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
  }, []); // Empty dependency array - function doesn't depend on any props/state

  // Load custom design URL on mount
  useEffect(() => {
    refreshCustomDesign();
  }, [refreshCustomDesign]);

  return (
    <DesignContext.Provider
      value={{
        selectedDesign,
        setSelectedDesign,
        customDesignUrl,
        setCustomDesignUrl,
        loadingCustomDesign,
        refreshCustomDesign,
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
