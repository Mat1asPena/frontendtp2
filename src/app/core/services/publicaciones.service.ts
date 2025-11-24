import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl = 'https://backendtp2-seven.vercel.app/api'; // https://backendtp2-seven.vercel.app/api || http://localhost:3000/api

  constructor(private http: HttpClient) {}

  getPublicaciones(page = 1, limit = 5, sort = 'fecha'): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}&sort=${sort}`);
  }

  likePublicacion(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/like`, {});
  }

  quitarLike(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/unlike`, {});
  }

  eliminarPublicacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}

