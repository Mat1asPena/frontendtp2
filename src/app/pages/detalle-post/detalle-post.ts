import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService, PostFront } from '../../core/services/posts.service';
import { PostComponent } from '../../shared/components/post/post'; // Reutilizamos tu componente

@Component({
  selector: 'app-detalle-post',
  standalone: true,
  imports: [CommonModule, PostComponent],
  templateUrl: './detalle-post.html',
  styleUrls: ['./detalle-post.css']
})
export class DetallePost implements OnInit {
  post: any = null; // Usamos 'any' temporalmente para facilitar la UI extendida
  loading = true;
  error = '';

  private route = inject(ActivatedRoute);
  private postService = inject(PostService);
  private router = inject(Router);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPost(id);
    } else {
      this.error = 'ID no especificado';
      this.loading = false;
    }
  }

  loadPost(id: string) {
    this.postService.getPostById(id).subscribe({
      next: (data) => {
        // Preparamos el objeto como lo espera el componente hijo (con arrays seguros)
        this.post = {
            ...data,
            comentarios: data.comentarios || [],
            // Inicializamos estados visuales para que el componente hijo no falle
            commentsPage: 1,
            showingComments: (data.comentarios || []).slice(0, 5), // Mostramos más comentarios de una vez en el detalle
            hasMoreComments: (data.comentarios || []).length > 5
        };
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo cargar la publicación.';
        this.loading = false;
      }
    });
  }

  goBack() {
    this.router.navigate(['/publicaciones']);
  }
}