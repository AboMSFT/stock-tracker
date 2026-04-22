import type { StorageAdapter } from '@inwealthment/shared';

export const webStorageAdapter: StorageAdapter = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(void localStorage.setItem(key, value)),
};
