import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Si estamos en SSR (servidor), permitir que se hidrate
  if (!isPlatformBrowser(platformId)) {
    console.log('🔐 AuthGuard - SSR mode, allowing');
    return true;
  }

  // En el navegador, verificar token
  const isLogged = authService.isLogged();
  const token = authService.getToken();
  console.log('🔐 AuthGuard - Browser mode - isLogged:', isLogged, 'Token:', token ? 'EXISTS' : 'null');

  if (isLogged) {
    return true;
  }

  console.log('❌ Redirecting to login');
  return router.createUrlTree(['/login']);
};


