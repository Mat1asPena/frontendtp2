import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PostService } from '../../core/services/posts.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
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
  private isBrowser: boolean;
  newPostForm!: FormGroup;
  commentText: { [key: string]: string } = {};

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
      titulo: [''],
      mensaje: [''],
      imagen: [null],
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
      .getPosts(this.orderBy, this.limit)
      .subscribe((posts: PostStub[]) => {
        this.posts = posts;
      });
  }

  // ================================
  //   CREATE POST REAL
  // ================================
  createPost() {
    if (!this.isBrowser) return;

    const user = this.auth.getUser();
    if (!user) return;

    const { titulo, mensaje, imagen } = this.newPostForm.value;
    if (!titulo.trim() || !mensaje.trim()) return;

    const sendPost = (imageUrl?: string) => {
      this.postService
        .createPost({
          titulo,
          mensaje,
          imagenUrl: imageUrl,
          author: user.nombreUsuario,
        })
        .subscribe(() => this.loadPostsFromBackend());
    };

    if (imagen) {
      const file = imagen as File;
      const reader = new FileReader();
      reader.onload = () => sendPost(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      sendPost();
    }

    this.newPostForm.reset();
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
    this.loadPostsFromBackend();
  }

  loadMore() {
    this.limit += 5;
    this.loadPostsFromBackend();
  }
}
