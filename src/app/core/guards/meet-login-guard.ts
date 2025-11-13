import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MeetingToken } from '../_services/meeting-token';

export const meetLoginGuard: CanActivateFn = () => {
  const meetToken = inject(MeetingToken);
  const router = inject(Router);

  if (meetToken.isLoggedIn()) {
    return router.parseUrl('/interview');
  }

  return true;
};