import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setRawValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const initialRef = useRef(initialValue);
  const hasUserEditsRef = useRef(false);

  useEffect(() => {
    let active = true;
    hasUserEditsRef.current = false;
    setHydrated(false);

    AsyncStorage.getItem(key)
      .then((stored) => {
        if (!active || !stored) return;
        try {
          if (!hasUserEditsRef.current) {
            setRawValue(JSON.parse(stored) as T);
          }
        } catch {
          if (!hasUserEditsRef.current) {
            setRawValue(initialRef.current);
          }
        }
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [key]);

  const setValue = useCallback((next: T | ((prev: T) => T)) => {
    hasUserEditsRef.current = true;
    setRawValue((prev) => {
      const nextValue = typeof next === 'function' ? (next as (value: T) => T)(prev) : next;
      AsyncStorage.setItem(key, JSON.stringify(nextValue)).catch(() => undefined);
      return nextValue;
    });
  }, [key]);

  const clear = useCallback(async () => {
    hasUserEditsRef.current = true;
    setRawValue(initialRef.current);
    await AsyncStorage.removeItem(key);
  }, [key]);

  return { value, setValue, clear, hydrated };
}
