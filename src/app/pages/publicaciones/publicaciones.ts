import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PostService, PostFront, Comentario } from '../../core/services/posts.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Post } from '../../shared/components/post/post';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, FormsModule],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})

export class Publicaciones implements OnInit {
  posts: PostFront[] = []; 
  orderBy: 'fecha' | 'likes' = 'fecha';
  limit = 5;
  page = 1;
  private isBrowser: boolean;
  newPostForm!: FormGroup;
  commentText: { [key: string]: string } = {};
  postImagePreview: string | ArrayBuffer | null = null;
  editingComment: { [key: string]: boolean } = {};
  editingText: { [key: string]: string } = {};

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
      imagen: [null], // Imagen opcional según requerimiento, o required si prefieres
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
      .getPosts(this.orderBy, this.limit, this.page)
      .subscribe((newPosts: PostFront[]) => {
        if (this.page === 1) {
            this.posts = newPosts;
        } else {
            this.posts = [...this.posts, ...newPosts];
        }
      });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.newPostForm.patchValue({ imagen: file });
      const reader = new FileReader();
      reader.onload = () => this.postImagePreview = reader.result;
      reader.readAsDataURL(file);
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
        this.loadPostsFromBackend();
        this.newPostForm.reset();
        this.postImagePreview = null;
    });
  }

  toggleLike(post: PostFront) {
    const currentUser = this.auth.getUser()?.nombreUsuario;
    if (!currentUser) return;

    this.postService.toggleLike(post._id, post.author).subscribe(updated => {
      post.likes = updated.likes;
      post.likedBy = updated.likedBy;
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
    });
  }

  addComment(post: PostFront) {
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

  saveCommentEdit(post: PostFront, comment: Comentario) {
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
    this.loadPostsFromBackend();
  }

  loadMore() {
    this.page++;
    this.loadPostsFromBackend();
  }
}