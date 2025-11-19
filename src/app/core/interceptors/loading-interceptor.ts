import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { PreloaderService } from '../_services/preloader-service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {

  const preloader = inject(PreloaderService);

  preloader.show();

  return next(req).pipe(
    finalize(() => preloader.hide())
  );
};