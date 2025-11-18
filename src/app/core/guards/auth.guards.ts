import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router'; // Agrega UrlTree
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(private auth: AuthService, private router: Router) {}

    canActivate(): boolean | UrlTree { // Cambia el tipo de retorno
        if (this.auth.isLogged()) {
            return true;
        }
        return this.router.createUrlTree(['/login']); 
    }
}