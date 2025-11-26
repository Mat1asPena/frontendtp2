import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private API_URL = 'http://localhost:3000/api/stats';
  constructor(private http: HttpClient) {}

  // AHORA ACEPTA RANGO DE FECHAS
  getPostsPerUser(startDate?: string, endDate?: string): Observable<any[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    
    return this.http.get<any[]>(`${this.API_URL}/posts-per-user`, { params });
  }

  getLikesByDate(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<any[]>(`${this.API_URL}/likes-by-date`, { params });
  }

  getCommentsByDate(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<any[]>(`${this.API_URL}/comments-by-date`, { params });
  }

  getCommentsPerPost(startDate: string, endDate: string): Observable<any[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<any[]>(`${this.API_URL}/comments-per-post`, { params });
  }
}