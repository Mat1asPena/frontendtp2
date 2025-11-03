import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', redirectTo: 'publicaciones', pathMatch: 'full' },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'publicaciones', loadComponent: () => import('./pages/publicaciones/publicaciones').then(m => m.Publicaciones) },
    { path: 'mi-perfil', loadComponent: () => import('./pages/mi-perfil/mi-perfil').then(m => m.MiPerfil) },
    { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
    { path: '**', redirectTo: 'publicaciones'}
];
