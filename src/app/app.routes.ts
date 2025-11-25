import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guards';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'publicaciones', loadComponent: () => import('./pages/publicaciones/publicaciones').then(m => m.Publicaciones), canActivate: [AuthGuard]},
    { path: 'mi-perfil', loadComponent: () => import('./pages/mi-perfil/mi-perfil').then(m => m.MiPerfil), canActivate: [AuthGuard] },
    { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
    { path: '**', redirectTo: 'publicaciones'}
];
