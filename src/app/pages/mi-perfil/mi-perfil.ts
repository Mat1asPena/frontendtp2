import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';

interface Post {
  titulo: string;
  fecha: string;
  author: string;
}

@Component({
  selector: 'app-mi-perfil',
  imports: [DatePipe],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil {
  user: any;
  myPosts: Post[] = [];

  constructor(private auth: AuthService) {
    this.user = this.auth.getUser();
  }

  ngOnInit() {
    const all = JSON.parse(localStorage.getItem('mockPosts') || '[]');
    const nombreUsuario = this.user?.nombreUsuario;
    this.myPosts = all.filter((p:any)=> p.author === nombreUsuario).slice(0,3);
  }
}
