import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service'; // Importar
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { Modal } from '../../shared/components/modal/modal'; // Tu modal

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [ Modal, FormsModule], // Agregar imports
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})

export class MiPerfil implements OnInit {
  user: any;
  myPosts: any[] = [];
  mostrarModal = false;
  editData: any = {};

  constructor(private auth: AuthService, private userService: UserService) {
    this.user = this.auth.getUser();
    this.editData = { ...this.user };
  }

  ngOnInit() {
    if (typeof window === 'undefined') return;
    const all = JSON.parse(localStorage.getItem('mockPosts') || '[]');
    const nombreUsuario = this.user?.nombreUsuario;
    this.myPosts = all.filter((p: any) => p.author === nombreUsuario).slice(0, 3);
  }

  guardarCambios() {
    if (!this.user?._id) return;

    this.userService.updateProfile(this.user._id, this.editData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.auth.saveLocalUser(updatedUser); // Actualizar localStorage
        this.mostrarModal = false;
        alert('Perfil actualizado!');
      },
      error: (err) => alert('Error al actualizar')
    });
  }
}
