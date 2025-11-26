import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-usuarios',
  imports: [CommonModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})

export class Usuarios implements OnInit {
  users: any[] = [];
  error = '';

  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit() {
    const me = this.auth.getUser();
    if (me?.perfil === 'administrador') {
      this.loadUsers();
    } else {
      this.loadUsers();
      // this.error = 'No tienes permisos para ver esta página.';
    }
  }

  loadUsers() {
    this.userService.getAll().subscribe({
        next: (res) => this.users = res,
        error: (err) => this.error = 'Error al cargar usuarios'
    });
  }

  toggleUser(id: string, enable: boolean) {
    const obs = enable 
        ? this.userService.enableUser(id) 
        : this.userService.disableUser(id);
    
    obs.subscribe(() => this.loadUsers());
  }
}
