import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MeetingToken } from '../_services/meeting-token';

export const meetAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(MeetingToken);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
