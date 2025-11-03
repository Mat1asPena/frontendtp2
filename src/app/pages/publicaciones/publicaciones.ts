import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePipe, isPlatformBrowser } from '@angular/common';

interface PostStub {
  id: string;
  titulo: string;
  mensaje: string;
  imagenUrl?: string;
  likes: number;
  fecha: string;
  author: string;
}

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit {
  posts: PostStub[] = [];
  orderBy: 'fecha'|'likes' = 'fecha';
  page = 0;
  limit = 5;
  private isBrowser: boolean;

  constructor(
    public auth: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    
    // Sprint1: usar local mock o traer desde backend si está listo
    const mockPosts = localStorage.getItem('mockPosts');
    if (mockPosts) this.posts = JSON.parse(mockPosts);
    else {
      // Genero algunos posts demo
      this.posts = Array.from({length:8}).map((_,i)=>({
        id: `p${i+1}`,
        titulo: `Post demo ${i+1}`,
        mensaje: `Mensaje de prueba ${i+1}`,
        likes: Math.floor(Math.random()*10),
        fecha: new Date(Date.now() - i*1000*60*60).toISOString(),
        author: 'demoUser'
      }));
      localStorage.setItem('mockPosts', JSON.stringify(this.posts));
    }
  }

  toggleLike(post: PostStub) {
    if (!this.isBrowser) return;

    // Sprint1: simulación local
    const currentUser = this.auth.getUser()?.nombreUsuario || 'anon';
    const key = `likes_${post.id}`;
    const liked = localStorage.getItem(`${key}_${currentUser}`);
    if (liked) {
      post.likes = Math.max(0, post.likes - 1);
      localStorage.removeItem(`${key}_${currentUser}`);
    } else {
      post.likes = post.likes + 1;
      localStorage.setItem(`${key}_${currentUser}`, '1');
    }
    localStorage.setItem('mockPosts', JSON.stringify(this.posts));
  }

  deletePost(postId: string) {
    if (!this.isBrowser) return;

    // baja lógica simulada: lo remuevo en sprint1
    this.posts = this.posts.filter(p => p.id !== postId);
    localStorage.setItem('mockPosts', JSON.stringify(this.posts));
  }

  changeOrder(o: 'fecha'|'likes') {
    this.orderBy = o;
    if (o === 'fecha') this.posts.sort((a,b)=> +new Date(b.fecha) - +new Date(a.fecha));
    else this.posts.sort((a,b)=> b.likes - a.likes);
  }

  loadMore() {
    this.limit += 5;
  }
}
