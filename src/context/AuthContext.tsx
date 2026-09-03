'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(FirebaseUser & Partial<UserProfileData>) | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch or subscribe to Firestore profile
        const userDocRef = doc(db, 'userProfiles', firebaseUser.uid);
        const unsubsDoc = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfileData;
            setProfile(data);
            setUser(Object.assign({}, firebaseUser, data));
          } else {
            setUser(firebaseUser as (FirebaseUser & Partial<UserProfileData>));
          }
          setLoading(false);
        }, () => {
          setUser(firebaseUser as (FirebaseUser & Partial<UserProfileData>));
          setLoading(false);
        });

        return () => unsubsDoc();
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || { user: null, profile: null, loading: false };
};
