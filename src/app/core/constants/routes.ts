/**
 * Route Constants
 * Centralized route definitions to avoid hardcoded strings
 */

export const ROUTES = {
  // Root & Auth
  ROOT: '',
  
  // Recruiter Routes
  RECRUITER: {
    LOGIN: '',
    DASHBOARD: '/dashboard',
    PROFILE_SEARCH: '/profile-search',
  },

  // Meeting Routes
  MEETING: {
    LOGIN: '/meeting-login',
    INTERVIEW: '/interview',
    AVATAR: '/avatar',
  },

  // Not Found
  NOT_FOUND: '**',
} as const;
