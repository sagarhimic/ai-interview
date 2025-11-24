import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Token } from '../_services/token';
import { ROUTES } from '../constants/routes';

export const loginGuard: CanActivateFn = () => {
  const tokenService = inject(Token);
  const router = inject(Router);

  if (tokenService.isLoggedIn()) {
    return router.parseUrl(ROUTES.RECRUITER.DASHBOARD); // redirect logged-in recruiter
  }

  return true; // allow login screen only when NOT logged in
};