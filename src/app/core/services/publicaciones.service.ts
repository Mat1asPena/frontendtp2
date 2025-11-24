import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PublicacionesService {
  private apiUrl = environment.apiUrl;

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

