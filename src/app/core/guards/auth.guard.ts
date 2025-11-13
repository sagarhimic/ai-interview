import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Token } from '../_services/token';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Token);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
