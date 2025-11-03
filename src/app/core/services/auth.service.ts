import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'any' })
export class AuthService {
  private base = ''; // cambiar por la URL de Render
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  register(formData: FormData): Observable<AuthResponse> {
    // endpoint backend: POST /auth/register
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, formData);
  }

  login(identifier: { usernameOrEmail: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, identifier).pipe(tap(res => {
      if (res?.token && this.isBrowser) {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
      }
    }));
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  isLogged(): boolean {
    return this.isBrowser ? !!localStorage.getItem('token') : false;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('token') : null;
  }

  getUser(): User | null {
    if (!this.isBrowser) return null;
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  saveLocalUser(user: User) {
    if (this.isBrowser) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}

