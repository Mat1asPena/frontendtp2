import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, NgModel, FormsModule } from '@angular/forms';
import { DatePipe, isPlatformBrowser} from '@angular/common';

interface Comentario {
  autor: string;
  texto: string;
  fecha: string;
}

interface PostStub {
  id: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string;
  likes: number;
  fecha: string;
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
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;

    this.newPostForm = this.fb.group({
      titulo: [''],
      mensaje: [''],
      imagen: [null],
    });

    const mockPosts = localStorage.getItem('mockPosts');
    if (mockPosts) {
      this.posts = JSON.parse(mockPosts);
    } else {
      this.posts = [];
      localStorage.setItem('mockPosts', JSON.stringify(this.posts));
    }
  }

  createPost() {
    if (!this.isBrowser) return;
    const user = this.auth.getUser();
    if (!user) return;

    const { titulo, mensaje, imagen } = this.newPostForm.value;
    if (!titulo.trim() || !mensaje.trim()) return;

    let imageUrl: string | undefined;
    if (imagen) {
      const file = imagen as File;
      const reader = new FileReader();
      reader.onload = () => {
        imageUrl = reader.result as string;
        this.savePost(titulo, mensaje, user.nombreUsuario, imageUrl);
      };
      reader.readAsDataURL(file);
    } else {
      this.savePost(titulo, mensaje, user.nombreUsuario);
    }

    this.newPostForm.reset();
  }

  private savePost(titulo: string, mensaje: string, author: string, imagenUrl?: string) {
    const newPost: PostStub = {
      id: crypto.randomUUID(),
      titulo,
      mensaje,
      imagenUrl,
      likes: 0,
      fecha: new Date().toISOString(),
      author,
      comentarios: [],
      likedBy: [],
    };
    this.posts.unshift(newPost);
    localStorage.setItem('mockPosts', JSON.stringify(this.posts));
  }

  toggleLike(post: PostStub) {
    const currentUser = this.auth.getUser()?.nombreUsuario;
    if (!currentUser) return;

    const alreadyLiked = post.likedBy.includes(currentUser);

    if (alreadyLiked) {
      post.likes = Math.max(0, post.likes - 1);
      post.likedBy = post.likedBy.filter(u => u !== currentUser);
    } else {
      post.likes++;
      post.likedBy.push(currentUser);
    }
    localStorage.setItem('mockPosts', JSON.stringify(this.posts));
  }

  deletePost(postId: string) {
    const currentUser = this.auth.getUser();
    if (!currentUser) return;

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    const isOwner = post.author === currentUser.nombreUsuario;
    const isAdmin = currentUser.rol === 'administrador';

    if (!isOwner && !isAdmin) {
      alert('Solo el autor o un administrador pueden eliminar esta publicación.');
      return;
    }

    this.posts = this.posts.filter(p => p.id !== postId);
    localStorage.setItem('mockPosts', JSON.stringify(this.posts));
  }

  addComment(post: PostStub) {
    const user = this.auth.getUser();
    if (!user) return;

    const text = this.commentText[post.id]?.trim();
    if (!text) return;

    const newComment: Comentario = {
      autor: user.nombreUsuario,
      texto: text,
      fecha: new Date().toISOString(),
    };

    post.comentarios.push(newComment);
    this.commentText[post.id] = '';
    localStorage.setItem('mockPosts', JSON.stringify(this.posts));
  }

  changeOrder(o: 'fecha' | 'likes') {
    this.orderBy = o;
    if (o === 'fecha') this.posts.sort((a, b) => +new Date(b.fecha) - +new Date(a.fecha));
    else this.posts.sort((a, b) => b.likes - a.likes);
  }

  loadMore() {
    this.limit += 5;
  }
}
