import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { AuthResponse } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = ''; // cambiar por la URL de Render
  constructor(private http: HttpClient) {}

  register(formData: FormData): Observable<AuthResponse> {
    // endpoint backend: POST /auth/register
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, formData);
  }

  login(identifier: { usernameOrEmail: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, identifier).pipe(tap(res => {
      if (res?.token) {
        localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
      }
    }));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLogged(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  saveLocalUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

