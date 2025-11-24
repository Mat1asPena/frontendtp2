import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comentario {
    autor: string;
    texto: string;
    fecha: string;
    }

    export interface PostFront {
    _id: string;
    titulo: string;
    mensaje: string;
    imagenUrl?: string;
    likes: number;
    createdAt: string;
    author: string;
    comentarios: Comentario[];
    likedBy: string[];
    }

    @Injectable({
    providedIn: 'root',
    })
    export class PostService {
    private API_URL = 'http://localhost:3000/api/posts';

    constructor(private http: HttpClient) {}

    // ✔ Obtener posts ordenados (fecha o likes)
    getPosts(orderBy: string, limit: number): Observable<PostFront[]> {
        let params = new HttpParams()
        .set('orderBy', orderBy)
        .set('limit', limit);

        return this.http.get<PostFront[]>(this.API_URL, { params });
    }

    // ✔ Crear post nuevo
    createPost(data: any): Observable<PostFront> {
        return this.http.post<PostFront>(this.API_URL, data);
    }

    // ✔ Like / Unlike
    toggleLike(id: string, username: string): Observable<PostFront> {
        return this.http.patch<PostFront>(`${this.API_URL}/${id}/like`, { username });
    }

    // ✔ Borrar post
    deletePost(id: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/${id}`);
    }

    // ✔ Agregar comentario
    addComment(id: string, comment: any): Observable<PostFront> {
        return this.http.patch<PostFront>(`${this.API_URL}/${id}/comment`, comment);
    }
}
