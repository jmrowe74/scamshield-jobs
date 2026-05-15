
'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * A hidden component that listens for global Firebase permission errors
 * and logs them to the console instead of throwing them.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      // Log to console instead of throwing to avoid dev overlay
      console.warn('Firestore permission error:', error.message);
    };
    errorEmitter.on('permission-error', handlePermissionError);
    return () => errorEmitter.off('permission-error', handlePermissionError);
  }, []);
  return null;
}