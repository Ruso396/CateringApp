import { updateProfile as apiUpdateProfile, fetchProfile } from '@/src/services/api';
import type { Profile } from '@/src/types';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setProfile(data);
    } catch {
      setProfile({
        id: 0,
        name: '',
        mobile: '',
        address: '',
        profile_image: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateProfile = useCallback(async (data: Partial<Profile>) => {
    await apiUpdateProfile(data);
    await refetch();
  }, [refetch]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refetch, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
