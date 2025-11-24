import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/posts.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Post } from '../../shared/components/post/post';

interface Comentario {
  autor: string;
  texto: string;
  fecha: string;
}

interface PostStub {
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

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, FormsModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  posts: PostStub[] = [];
  orderBy: 'fecha' | 'likes' = 'fecha';
  limit = 5;
  page = 1; // Nueva variable para controlar la página actual
  private isBrowser: boolean;
  newPostForm!: FormGroup;
  commentText: { [key: string]: string } = {};
  postImagePreview: string | ArrayBuffer | null = null; // Variable para preview en el formulario de post

  constructor(
    public auth: AuthService,
    private postService: PostService,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.newPostForm = this.fb.group({
      titulo: ['', [Validators.required]],
      mensaje: ['', [Validators.required]],
      imagen: [null,[Validators.required]],
    });

    if (this.isBrowser) {
      this.loadPostsFromBackend();
    }
  }
  // ================================
  //   GET POSTS FROM BACKEND
  // ================================
  loadPostsFromBackend() {
    this.postService
      .getPosts(this.orderBy, this.limit, this.page) // Enviamos la página actual
      .subscribe((newPosts: PostStub[]) => {
        if (this.page === 1) {
            this.posts = newPosts; // Si es la primera página, reemplazamos
        } else {
            this.posts = [...this.posts, ...newPosts]; // Si es "Cargar más", añadimos
        }
      });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newPostForm.patchValue({ imagen: file });
      
      // Preview
      const reader = new FileReader();
      reader.onload = () => this.postImagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  // ================================
  //   CREATE POST REAL
  // ================================
  createPost() {
    if (!this.isBrowser) return;
    if (this.newPostForm.invalid) {
        this.newPostForm.markAllAsTouched();
        return;
    }

    const user = this.auth.getUser();
    if (!user) return;

    // Usamos FormData para enviar archivo + datos
    const fd = new FormData();
    fd.append('titulo', this.newPostForm.get('titulo')?.value);
    fd.append('mensaje', this.newPostForm.get('mensaje')?.value);
    // El autor lo pone el backend desde el token, pero si tu backend lo requiere en el body:
    // fd.append('author', user.nombreUsuario); 

    const file = this.newPostForm.get('imagen')?.value;
    if (file instanceof File) {
        fd.append('imagen', file);
    }

    this.postService.createPost(fd).subscribe(() => {
        this.page = 1; // Resetear a la primera página al crear post
        this.loadPostsFromBackend();
        this.newPostForm.reset();
        this.postImagePreview = null; // Limpiar preview
    });
  }

  // ================================
  //         LIKE REAL
  // ================================
  toggleLike(post: PostStub) {
    const currentUser = this.auth.getUser()?.nombreUsuario;
    if (!currentUser) return;

    this.postService.toggleLike(post._id, post.author).subscribe(updated => {
      post.likes = updated.likes;
      post.likedBy = updated.likedBy;
    });
  }

  // ================================
  //        DELETE REAL
  // ================================
  deletePost(postId: string) {
    const currentUser = this.auth.getUser();
    if (!currentUser) return;

    const post = this.posts.find(p => p._id === postId);
    if (!post) return;

    const isOwner = post.author === currentUser.nombreUsuario;
    const isAdmin = currentUser.rol === 'administrador';

    if (!isOwner && !isAdmin) {
      alert('Solo el autor o un administrador pueden eliminar esta publicación.');
      return;
    }

    this.postService.deletePost(postId).subscribe(() => {
      this.posts = this.posts.filter(p => p._id !== postId);
    });
  }

  // ================================
  //        ADD COMMENT REAL
  // ================================
  addComment(post: PostStub) {
    const user = this.auth.getUser();
    if (!user) return;

    const text = this.commentText[post._id]?.trim();
    if (!text) return;

    this.postService
      .addComment(post._id, {
        autor: user.nombreUsuario,
        texto: text,
        fecha: new Date().toISOString(),
      })
      .subscribe(updated => {
        post.comentarios = updated.comentarios;
        this.commentText[post._id] = '';
      });
  }

  // ================================
  //        ORDER & LOAD MORE
  // ================================
  changeOrder(o: 'fecha' | 'likes') {
    this.orderBy = o;
    this.page = 1; // Resetear página al cambiar orden
    this.posts = []; // Limpiar lista visualmente
    this.loadPostsFromBackend();
  }

  loadMore() {
    this.page++; // Aumentar página
    this.loadPostsFromBackend();
  }
}
