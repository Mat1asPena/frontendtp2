import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private API_URL = 'http://localhost:3000/api/stats';
  constructor(private http: HttpClient) {}

  getPostsPerUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/posts-per-user`);
  }

  // Métodos que aceptan rango de tiempo
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