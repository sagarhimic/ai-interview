import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MeetingToken } from '../_services/meeting-token';
import { ROUTES } from '../constants/routes';

export const meetLoginGuard: CanActivateFn = () => {
  const meetToken = inject(MeetingToken);
  const router = inject(Router);

  if (meetToken.isLoggedIn()) {
    return router.parseUrl(ROUTES.MEETING.INTERVIEW);
  }

  return true;
};