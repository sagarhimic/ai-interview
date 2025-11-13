import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Token } from '../_services/token';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(Token);
  const router = inject(Router);

  const isLoggedIn = tokenService.isLoggedIn(); // must return true/false

  if (isLoggedIn) {
    return true;
  }

  return router.parseUrl('/');
};