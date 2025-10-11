"use client";

import { useMemo, type DependencyList } from "react";

// This hook is a workaround for the fact that Firebase query objects are not memoized by default.
// This can cause infinite loops when used with hooks that have a dependency array.
// This hook ensures that the query object is only recreated when its dependencies change.
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
