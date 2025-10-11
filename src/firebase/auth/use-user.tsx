"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useAuth } from "@/firebase/provider";

export type UserRole = "admin" | "user" | null;

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Force a token refresh to get the latest custom claims.
        const tokenResult = await user.getIdTokenResult(true);
        const userRole = tokenResult.claims.role as UserRole;

        setRole(userRole);
        setIsAdmin(userRole === "admin");
      } else {
        setUser(null);
        setRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading, role, isAdmin };
}
