"use client";

import { useState, useEffect } from "react";
import { onSnapshot, type Query } from "firebase/firestore";

export function useCollection<T>(query: Query | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error in useCollection hook: ", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading };
}
