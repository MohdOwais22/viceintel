'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { DiscordAuthData } from '../types';

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  gamerTag?: string;
  avatar?: string;
  isVip?: boolean;
  isAdmin?: boolean;
  isStaff?: boolean;
  discordConnected?: boolean;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  discordAuth?: DiscordAuthData;
  clearanceLevel?: string;
}

interface AuthContextType {
  user: (FirebaseUser & Partial<UserProfileData>) | null;
  profile: UserProfileData | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & Partial<UserProfileData>) | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMongoProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const emailParam = firebaseUser.email ? `&email=${encodeURIComponent(firebaseUser.email)}` : '';
      const res = await fetch(`/api/user/profile?uid=${encodeURIComponent(firebaseUser.uid)}${emailParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
          setUser(prev => {
            if (prev && prev.uid === firebaseUser.uid) {
              return { ...prev, ...json.data };
            }
            return Object.assign({}, firebaseUser, json.data);
          });
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch profile from MongoDB API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: any = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser as (FirebaseUser & Partial<UserProfileData>));
        await fetchMongoProfile(firebaseUser);

        // Periodically refresh profile from MongoDB
        intervalId = setInterval(() => {
          fetchMongoProfile(firebaseUser);
        }, 20000);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
        if (intervalId) clearInterval(intervalId);
      }
    });

    return () => {
      unsubscribe();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      await fetchMongoProfile(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || { user: null, profile: null, loading: false, refreshProfile: async () => {} };
};
