"use client";

import { useState, useEffect } from "react";
import { onSnapshot, type DocumentReference } from "firebase/firestore";

export function useDoc<T>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? (snapshot.data() as T) : null);
        setLoading(false);
      },
      (error) => {
        console.error("Error in useDoc hook: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading };
}
