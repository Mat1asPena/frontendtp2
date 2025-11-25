import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostService, PostFront, Comentario } from '../../../core/services/posts.service';
import { AuthService } from '../../../core/services/auth.service';

interface PostUI extends PostFront {
  showingComments?: Comentario[];
  hasMoreComments?: boolean;
  commentsPage?: number;
}

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post.html',
  styleUrls: ['./post.css'] // Asegúrate de mover los estilos aquí
})
export class PostComponent implements OnInit {
  @Input() post!: PostUI; // Recibimos el post del padre
  
  auth = inject(AuthService);
  private postService = inject(PostService);

  // Variables locales (ya no necesitamos diccionarios por ID)
  commentText: string = '';
  editingCommentId: string | null = null;
  editingText: string = '';

  ngOnInit() {
    // Inicializar estado de comentarios si no viene listo
    if (!this.post.showingComments) {
      this.post.showingComments = this.post.comentarios.slice(0, 2);
      this.post.hasMoreComments = this.post.comentarios.length > 2;
      this.post.commentsPage = 1;
    }
  }

  // --- LÓGICA MOVIDA DESDE PUBLICACIONES.TS ---

  toggleLike() {
    this.postService.toggleLike(this.post._id, this.post.author).subscribe(updated => {
      this.post.likes = updated.likes;
      this.post.likedBy = updated.likedBy;
    });
  }

  deletePost() {
    // Aquí quizás prefieras emitir un evento al padre para que lo saque de la lista principal
    // O llamar al servicio y luego emitir. Por simplicidad:
    if(confirm('¿Borrar publicación?')) {
        this.postService.deletePost(this.post._id).subscribe(() => {
            // Emitir evento de eliminado (Output) sería lo ideal
            window.location.reload(); // Solución rápida temporal
        });
    }
  }

  addComment() {
    if (!this.commentText.trim()) return;
    const nuevo = { autor: this.auth.getUser()?.nombreUsuario, texto: this.commentText, fecha: new Date().toISOString() };
    
    this.postService.addComment(this.post._id, nuevo).subscribe(updated => {
      this.post.comentarios = updated.comentarios;
      // Agregar al final de la lista visible
      const realComment = updated.comentarios[updated.comentarios.length - 1];
      this.post.showingComments?.push(realComment);
      this.commentText = '';
    });
  }

  loadMoreComments() {
    const nextPage = (this.post.commentsPage || 1) + 1;
    this.postService.getComments(this.post._id, nextPage, 5).subscribe(newComments => {
        if (newComments.length > 0) {
            this.post.showingComments?.push(...newComments);
            this.post.commentsPage = nextPage;
            if (newComments.length < 5) this.post.hasMoreComments = false;
        } else {
            this.post.hasMoreComments = false;
        }
    });
  }

  // Edición de comentarios
  startEditing(c: Comentario) {
    if(!c._id) return;
    this.editingCommentId = c._id;
    this.editingText = c.texto;
  }

  cancelEditing() {
    this.editingCommentId = null;
    this.editingText = '';
  }

  saveComment(c: Comentario) {
    if (!c._id || !this.editingText.trim()) return;
    this.postService.updateComment(this.post._id, c._id, this.editingText).subscribe(updated => {
        // Buscar y actualizar en la lista local
        const index = this.post.showingComments?.findIndex(x => x._id === c._id);
        if (index !== undefined && index !== -1 && this.post.showingComments) {
            this.post.showingComments[index].texto = this.editingText;
            this.post.showingComments[index].modificado = true;
        }
        this.cancelEditing();
    });
  }
}