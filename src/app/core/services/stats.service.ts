import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  private API_URL = 'http://localhost:3000/api/stats';

  constructor(private http: HttpClient) {}

  getTotalUsers(): Observable<{ totalUsers: number }> {
    return this.http.get<{ totalUsers: number }>(`${this.API_URL}/total-users`);
  }

  getPostsPerUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/posts-per-user`);
  }

  getLikesByDate(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/likes-by-date`);
  }
}