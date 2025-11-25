import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'any' })
export class AuthService {
  private base = 'http://localhost:3000/api';
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
    console.log('🔑 Attempting login with:', identifier.usernameOrEmail);
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, identifier).pipe(tap(res => {
      console.log('✅ Login response:', res);
      if (res?.token) {
        if (typeof window !== 'undefined') {
          console.log('💾 Saving token to localStorage');
          localStorage.setItem('token', res.token);
          if (res.user) {
            localStorage.setItem('user', JSON.stringify(res.user));
            console.log('💾 User saved:', res.user);
          }
        } else {
          console.log('⚠️ SSR mode - not saving to localStorage');
        }
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
    if (typeof window === 'undefined') return false; // SSR - no hay localStorage
    try {
      const token = localStorage.getItem('token');
      return !!token;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null; // SSR
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
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

  refreshToken(): Observable<any> {
    return this.http.post(`${this.base}/auth/refresh`, {}).pipe(tap((res: any) => {
        if (res.token) localStorage.setItem('token', res.token);
    }));
  }
}

