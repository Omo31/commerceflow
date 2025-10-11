"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";
import {
  getRemoteConfig,
  fetchAndActivate,
  type RemoteConfig,
} from "firebase/remote-config";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
  functions: Functions | null;
  user: User | null;
  loading: boolean;
  remoteConfig: RemoteConfig | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  firestore: null,
  storage: null,
  functions: null,
  user: null,
  loading: true,
  remoteConfig: null,
});

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [firestore, setFirestore] = useState<Firestore | null>(null);
  const [storage, setStorage] = useState<FirebaseStorage | null>(null);
  const [functions, setFunctions] = useState<Functions | null>(null);
  const [remoteConfig, setRemoteConfig] = useState<RemoteConfig | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    const storage = getStorage(app);
    const functions = getFunctions(app);
    const remoteConfig = getRemoteConfig(app);

    remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
    remoteConfig.defaultConfig = {
      app_title: "CommerceFlow",
    };

    fetchAndActivate(remoteConfig);

    setApp(app);
    setAuth(auth);
    setFirestore(firestore);
    setStorage(storage);
    setFunctions(functions);
    setRemoteConfig(remoteConfig);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const contextValue = useMemo(
    () => ({
      app,
      auth,
      firestore,
      storage,
      functions,
      user,
      loading,
      remoteConfig,
    }),
    [app, auth, firestore, storage, functions, user, loading, remoteConfig],
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseApp() {
  return useContext(FirebaseContext)?.app;
}

export function useAuth() {
  return useContext(FirebaseContext)?.auth;
}

export function useFirestore() {
  return useContext(FirebaseContext)?.firestore;
}

export function useStorage() {
  return useContext(FirebaseContext)?.storage;
}

export function useFunctions() {
  return useContext(FirebaseContext)?.functions;
}

export function useRemoteConfig() {
  return useContext(FirebaseContext)?.remoteConfig;
}

export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
