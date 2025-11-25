import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Comentario {
    _id?: string;          // Agregado (es opcional porque al crear uno nuevo no lo tienes aún)
    autor: string;
    texto: string;
    fecha: string;
    modificado?: boolean;  // Agregado
}

export interface PostFront {
    _id: string;
    titulo: string;
    mensaje: string;
    imagenUrl?: string;
    likes: number;
    createdAt: string;
    author: string;
    authorAvatar?: string;
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
    getPosts(orderBy: string, limit: number, page: number = 1, author?: string): Observable<PostFront[]> {
        let params = new HttpParams()
            .set('orderBy', orderBy)
            .set('limit', limit)
            .set('page', page); // Agregar page

        if (author) {
            params = params.set(author, 'author');
        }
        return this.http.get<PostFront[]>(this.API_URL, { params });
    }

    // ✔ Crear post nuevo
    createPost(data: FormData): Observable<PostFront> {
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
        return this.http.post<PostFront>(`${this.API_URL}/${id}/comentarios`, comment);
    }

    // ✔ Editar comentario
    updateComment(postId: string, commentId: string, texto: string): Observable<PostFront> {
        return this.http.put<PostFront>(`${this.API_URL}/${postId}/comentarios/${commentId}`, { texto });
    }

    // ✔ Get comments paginated
    getComments(postId: string, page: number, limit: number): Observable<Comentario[]> {
        const params = new HttpParams()
            .set('page', page)
            .set('limit', limit);
        return this.http.get<Comentario[]>(`${this.API_URL}/${postId}/comentarios`, { params });
    }
}
