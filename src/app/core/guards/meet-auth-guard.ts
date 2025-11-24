import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MeetingToken } from '../_services/meeting-token';
import { ROUTES } from '../constants/routes';

export const meetAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(MeetingToken);
  const router = inject(Router);

  const loggedIn = auth.isLoggedIn();

  if (loggedIn) {
    return true;
  }

  return router.parseUrl(ROUTES.MEETING.LOGIN);
};