import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PostService, PostFront } from '../../core/services/posts.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { PostComponent } from '../../shared/components/post/post';
import { Modal } from '../../shared/components/modal/modal';

interface PostUI extends PostFront {
    commentsPage?: number;
    showingComments?: any[];
    hasMoreComments?: boolean;
}

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, PostComponent, Modal],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Publicaciones implements OnInit {
  posts: PostUI[] = []; 
  orderBy: 'fecha' | 'likes' = 'fecha';
  limit = 5;
  page = 1;
  private isBrowser: boolean;
  newPostForm!: FormGroup;
  postImagePreview: string | ArrayBuffer | null = null;
  isLoading = false;

  // --- PROPIEDADES DEL MODAL ---
  showDeleteModal = false;
  deleteModalMessage = '';
  pendingDeletePostId: string | null = null;

  constructor(
    public auth: AuthService,
    private postService: PostService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.newPostForm = this.fb.group({
      titulo: ['', [Validators.required]],
      mensaje: ['', [Validators.required]],
      imagen: [null],
    });

    if (this.isBrowser) {
      this.loadPostsFromBackend();
    }
  }

  //   GET POSTS FROM BACKEND
  private mapPosts(posts: PostFront[]): PostUI[] {
    return posts.map(p => {
        // BLINDAJE: Asegurar que comentarios exista, si no, usar array vacío
        const comentariosSeguros = p.comentarios || []; 

        return {
            ...p,
            comentarios: comentariosSeguros, // Guardamos el array seguro
            commentsPage: 1,
            showingComments: comentariosSeguros.slice(0, 2), // Ahora slice nunca fallará
            hasMoreComments: comentariosSeguros.length > 2 
        };
    });
  }

  loadPostsFromBackend() {
    this.isLoading = true;
    this.cdr.markForCheck();
    
    console.log('📥 Iniciando carga de posts - página:', this.page, 'orderBy:', this.orderBy);
    
    this.postService.getPosts(this.orderBy, this.limit, this.page).subscribe({ // Usar sintaxis de objeto para mejor manejo de error
      next: (newPosts) => {
        console.log('✅ Posts recibidos del backend:', newPosts?.length || 0, 'posts');
        try {
            const mappedPosts = this.mapPosts(newPosts);
            if (this.page === 1) {
                this.posts = mappedPosts;
            } else {
                this.posts = [...this.posts, ...mappedPosts];
            }
            console.log('📊 Total de posts en componente:', this.posts.length);
        } catch (e) {
            console.error('Error procesando posts:', e);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error loading posts:', error);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newPostForm.patchValue({ imagen: file });
      const reader = new FileReader();
      reader.onload = () => {
        this.postImagePreview = reader.result;
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
      this.cdr.markForCheck();
    }
  }

  createPost() {
    if (!this.isBrowser) return;
    if (this.newPostForm.invalid) {
        this.newPostForm.markAllAsTouched();
        return;
    }

    const user = this.auth.getUser();
    if (!user) return;

    const fd = new FormData();
    fd.append('titulo', this.newPostForm.get('titulo')?.value);
    fd.append('mensaje', this.newPostForm.get('mensaje')?.value);

    const file = this.newPostForm.get('imagen')?.value;
    if (file instanceof File) {
        fd.append('imagen', file);
    }

    this.postService.createPost(fd).subscribe(() => {
        this.page = 1;
        this.newPostForm.reset();
        this.postImagePreview = null;
        this.cdr.markForCheck();
        this.loadPostsFromBackend();
    });
  }

  toggleLike(post: PostUI) {
    const currentUser = this.auth.getUser()?.nombreUsuario;
    if (!currentUser) return;

    this.postService.toggleLike(post._id, post.author).subscribe(updated => {
      post.likes = updated.likes;
      post.likedBy = updated.likedBy;
      this.cdr.markForCheck();
    });
  }

  deletePost(postId: string) {
    const currentUser = this.auth.getUser();
    if (!currentUser) return;

    const post = this.posts.find(p => p._id === postId);
    if (!post) return;

    const isOwner = post.author === currentUser.nombreUsuario;
    const isAdmin = currentUser.rol === 'administrador';

    if (!isOwner && !isAdmin) {
      this.deleteModalMessage = 'Solo el autor o un administrador pueden eliminar esta publicación.';
      this.showDeleteModal = true;
      this.cdr.markForCheck();
      return;
    }

    // Guardar el ID para confirmar después
    this.pendingDeletePostId = postId;
    this.deleteModalMessage = '¿Estás seguro de que deseas eliminar esta publicación?';
    this.showDeleteModal = true;
    this.cdr.markForCheck();
  }

  // Método para confirmar eliminación
  confirmDelete() {
    if (!this.pendingDeletePostId) return;

    this.postService.deletePost(this.pendingDeletePostId).subscribe({
      next: () => {
        this.posts = this.posts.filter(p => p._id !== this.pendingDeletePostId);
        this.showDeleteModal = false;
        this.pendingDeletePostId = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al eliminar post:', err);
        this.showDeleteModal = false;
        this.pendingDeletePostId = null;
        this.cdr.markForCheck();
      }
    });
  }

  // Método para cancelar eliminación
  cancelDelete() {
    this.showDeleteModal = false;
    this.pendingDeletePostId = null;
    this.cdr.markForCheck();
  }

  changeOrder(o: 'fecha' | 'likes') {
    this.orderBy = o;
    this.page = 1;
    this.posts = [];
    this.cdr.markForCheck();
    this.loadPostsFromBackend();
  }

  loadMore() {
    this.page++;
    this.loadPostsFromBackend();
  }

  loadMoreComments(post: PostUI) {
    const nextPage = (post.commentsPage || 1) + 1;
    const limit = 5;
    this.postService.getComments(post._id, nextPage, limit).subscribe({
        next: (newComments) => {
            if (newComments.length > 0) {
                post.showingComments = [...(post.showingComments || []), ...newComments];
                post.commentsPage = nextPage;
                if (newComments.length < limit) {
                    post.hasMoreComments = false;
                }
            } else {
                post.hasMoreComments = false;
            }
            this.cdr.markForCheck();
        },
        error: (err) => console.error('Error loading comments', err)
    });
  }
}