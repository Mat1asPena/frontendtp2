import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-post',
  imports: [DatePipe],
  templateUrl: './post.html',
  styleUrl: './post.css',
})

export class Post {
  @Input() publicacion: any;
  @Input() usuarioActualId!: number;
  @Output() like = new EventEmitter<number>();
  @Output() unlike = new EventEmitter<number>();
  @Output() eliminar = new EventEmitter<number>();

  dioLike(): boolean {
    return this.publicacion.likes.includes(this.usuarioActualId);
  }

  toggleLike() {
    if (this.dioLike()) {
      this.unlike.emit(this.publicacion.id);
    } else {
      this.like.emit(this.publicacion.id);
    }
  }

  eliminarPost() {
    this.eliminar.emit(this.publicacion.id);
  }
}
