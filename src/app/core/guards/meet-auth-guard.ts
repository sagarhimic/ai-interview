import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MeetingToken } from '../_services/meeting-token';

export const meetAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(MeetingToken);
  const router = inject(Router);

  const loggedIn = auth.isLoggedIn(); // your function

  if (loggedIn) {
    return true;
  }

  return router.parseUrl('/meeting-login');
};