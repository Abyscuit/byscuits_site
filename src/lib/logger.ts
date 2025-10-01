/* eslint-disable no-console */
// Simple logging utility that respects production environment
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, ...args);
    } else {
      // In production, you might want to send to a logging service
      // For now, we'll still log errors but with less detail
      console.error(`[ERROR] ${message}`);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};