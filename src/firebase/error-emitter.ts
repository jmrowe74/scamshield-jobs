
'use client';

import { FirestorePermissionError } from './errors';

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class ErrorEmitter {
  private listeners: { [K in keyof ErrorEvents]?: ErrorEvents[K][] } = {};

  on<K extends keyof ErrorEvents>(event: K, listener: ErrorEvents[K]) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(listener);
  }

  off<K extends keyof ErrorEvents>(event: K, listener: ErrorEvents[K]) {
    this.listeners[event] = this.listeners[event]?.filter((l) => l !== listener);
  }

  emit<K extends keyof ErrorEvents>(event: K, ...args: Parameters<ErrorEvents[K]>) {
    this.listeners[event]?.forEach((listener) => {
      // @ts-ignore
      listener(...args);
    });
  }
}

export const errorEmitter = new ErrorEmitter();
