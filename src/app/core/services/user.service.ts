import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Asegúrate de que esta URL sea correcta para tu backend
  private apiUrl = 'https://backendtp2-rho.vercel.app/api/users'; 

  constructor(private http: HttpClient) {}

  // ESTE ES EL MÉTODO QUE TE FALTA
  updateProfile(userId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, data);
  }
}
