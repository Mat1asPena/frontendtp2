import { Component, OnInit, PLATFORM_ID, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PostService, PostFront as PostFront, Comentario } from '../../core/services/posts.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Post } from '../../shared/components/post/post';

interface PostUI extends PostFront {
    commentsPage?: number;
    showingComments?: Comentario[]; // Comments currently visible
    hasMoreComments?: boolean;
}

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, FormsModule],
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
  commentText: { [key: string]: string } = {};
  postImagePreview: string | ArrayBuffer | null = null;
  editingComment: { [key: string]: boolean } = {};
  editingText: { [key: string]: string } = {};
  isLoading = false;

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
      imagen: [null], // Imagen opcional según requerimiento, o required si prefieres
    });

    if (this.isBrowser) {
      this.page = 1;
      this.posts = [];
      this.loadPostsFromBackend();
    }
  }
  // ================================
  //   GET POSTS FROM BACKEND
  // ================================
  private mapPosts(posts: PostFront[]): PostUI[] {
    return posts.map(p => ({
        ...p,
        commentsPage: 1,
        // Initially show only first 2 comments (or whatever came from backend)
        showingComments: p.comentarios.slice(0, 2), 
        // Determine if there are more locally or assume true to verify with backend
        hasMoreComments: p.comentarios.length > 2 
    }));
  }

  loadPostsFromBackend() {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.postService.getPosts(this.orderBy, this.limit, this.page).subscribe((newPosts) => {
      const mappedPosts = this.mapPosts(newPosts);
      if (this.page === 1) {
        this.posts = mappedPosts;
      } else {
        this.posts = [...this.posts, ...mappedPosts];
      }
      this.isLoading = false;
      this.cdr.markForCheck();
    }, (error) => {
      console.error('Error loading posts:', error);
      this.isLoading = false;
      this.cdr.markForCheck();
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
      alert('Solo el autor o un administrador pueden eliminar esta publicación.');
      return;
    }

    this.postService.deletePost(postId).subscribe(() => {
      this.posts = this.posts.filter(p => p._id !== postId);
      this.cdr.markForCheck();
    });
  }

  addComment(post: PostUI) {
    const user = this.auth.getUser();
    if (!user) return;

    const text = this.commentText[post._id]?.trim();
    if (!text) return;

    const nuevoComentario = {
      autor: user.nombreUsuario,
      texto: text,
      fecha: new Date().toISOString(),
    };

    this.postService.addComment(post._id, nuevoComentario).subscribe({
      next: (updatedPost) => {
        // 1. Actualizamos la fuente de verdad (todos los comentarios)
        post.comentarios = updatedPost.comentarios;

        // 2. Obtenemos el comentario real guardado (el último del array devuelto)
        // Esto asegura que tengamos el _id correcto generado por Mongo
        const comentarioReal = updatedPost.comentarios[updatedPost.comentarios.length - 1];

        // 3. Lo agregamos a la lista VISIBLE para que aparezca abajo
        if (!post.showingComments) {
          post.showingComments = [];
        }
        post.showingComments.push(comentarioReal);

        // 4. Limpiamos el input
        this.commentText[post._id] = '';
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Error al comentar:', err)
    });
  }

  startEditingComment(comment: Comentario) {
    if (!comment._id) return; 
    this.editingComment[comment._id] = true;
    this.editingText[comment._id] = comment.texto;
  }

  cancelEditingComment(commentId: string | undefined) {
    if (!commentId) return;
    this.editingComment[commentId] = false;
    delete this.editingText[commentId];
  }

  saveCommentEdit(post: PostUI, comment: Comentario) {
    if (!comment._id) return;
    const newText = this.editingText[comment._id];
    if (!newText || !newText.trim()) return;

    this.postService.updateComment(post._id, comment._id, newText).subscribe({
      next: (updatedPost) => {
        if (updatedPost) {
            const index = this.posts.findIndex(p => p._id === post._id);
            if (index !== -1) {
              this.posts[index] = updatedPost;
            }
        }
        this.cancelEditingComment(comment._id);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error editando comentario', err);
        // Opcional: Mostrar mensaje al usuario
      }
    });
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