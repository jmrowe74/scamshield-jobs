
'use client';

import { useMemo, useRef } from 'react';

/**
 * A hook that memoizes a Firebase reference or query.
 * It uses a ref to store the previous dependencies and only updates the memoized value
 * if the dependencies have changed.
 */
export function useMemoFirebase<T>(factory: () => T, deps: any[]): T {
  const depsRef = useRef<any[]>(deps);
  const valueRef = useRef<T>(factory());

  const depsChanged = deps.length !== depsRef.current.length || 
    deps.some((dep, i) => dep !== depsRef.current[i]);

  if (depsChanged) {
    depsRef.current = deps;
    valueRef.current = factory();
  }

  return valueRef.current;
}
