import { TokenService } from './token-service';
import { StorageService } from './storage';
import { Router } from '@angular/router';
import { ROUTES } from '../constants/routes';

/**
 * Factory functions for creating configured TokenService instances
 */

/** Create TokenService for Recruiter flow */
export function createRecruiterTokenService(storage: StorageService, router: Router): TokenService {
  const service = new TokenService(storage, router);
  service.init('access_token', 'recruiter', ROUTES.ROOT);
  return service;
}

/** Create TokenService for Meeting flow */
export function createMeetingTokenService(storage: StorageService, router: Router): TokenService {
  const service = new TokenService(storage, router);
  service.init('meet_access_token', 'meeting', ROUTES.MEETING.LOGIN);
  return service;
}
