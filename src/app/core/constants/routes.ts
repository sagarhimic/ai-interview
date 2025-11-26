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
    SCHEDULE_INTERVIEW: '/schedule-interview',
    SCHEDULE_NEW_INTERVIEW: '/schedule-interview/new',
  },

  // Meeting Routes
  MEETING: {
    EXPIRED: '/meeting-expired',
    LOGIN: '/meeting-login',
    INTERVIEW: '/interview',
    AVATAR: '/avatar',
  },

  // Not Found
  NOT_FOUND: '**',
} as const;
