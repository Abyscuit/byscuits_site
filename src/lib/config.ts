import path from 'path';

// Production-ready configuration
export const config = {
  // Get the base URL, handling both development and production
  getBaseUrl: () => {
    if (process.env.NEXTAUTH_URL) {
      return process.env.NEXTAUTH_URL;
    }
    
    // Fallback for production environments
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Default fallback
    return 'http://localhost:3000';
  },

  // Get uploads directory with proper path resolution
  getUploadsDir: () => {
    return process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
  },

  // Get data directory with proper path resolution
  getDataDir: () => {
    return process.env.DATA_DIR || path.join(process.cwd(), 'data');
  },

  // Check if we're in production
  isProduction: () => {
    return process.env.NODE_ENV === 'production';
  },

  // Get admin emails
  getAdminEmails: () => {
    return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);
  }
};