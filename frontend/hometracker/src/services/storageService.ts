/**
 * Storage Service
 * 
 * Centralizes all persistence logic. This allows us to easily swap 
 * localStorage (Web) for AsyncStorage (React Native) or other 
 * platform-specific storage in the future.
 */

const KEYS = {
  TOKEN: 'token',
  USER_ID: 'userId',
  USER_NAME: 'userName',
};

export const storageService = {
  // --- Auth Token ---
  getToken: (): string | null => {
    return localStorage.getItem(KEYS.TOKEN);
  },
  setToken: (token: string): void => {
    localStorage.setItem(KEYS.TOKEN, token);
  },
  clearToken: (): void => {
    localStorage.removeItem(KEYS.TOKEN);
  },

  // --- User Metadata ---
  getUserId: (): string | null => {
    return localStorage.getItem(KEYS.USER_ID);
  },
  setUserId: (id: string): void => {
    localStorage.setItem(KEYS.USER_ID, id);
  },
  
  getUserName: (): string | null => {
    return localStorage.getItem(KEYS.USER_NAME);
  },
  setUserName: (name: string): void => {
    localStorage.setItem(KEYS.USER_NAME, name);
  },

  // --- Global ---
  clearAll: (): void => {
    localStorage.clear();
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(KEYS.TOKEN);
  }
};

export default storageService;
