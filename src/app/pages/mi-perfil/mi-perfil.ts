import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { FormsModule } from '@angular/forms';
import { Modal } from '../../shared/components/modal/modal';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [Modal, FormsModule],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  user: any = null;
  myPosts: any[] = [];
  mostrarModal = false;
  editData: any = {};
  errorMessage = '';

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    console.log('🔍 MiPerfil constructor - getting user...');
    this.user = this.auth.getUser();
    console.log('👤 User from auth:', this.user);
    
    if (!this.user) {
      console.error('❌ No user found in constructor');
      this.errorMessage = 'No se encontró información de usuario. Por favor inicia sesión nuevamente.';
      // No redirigir inmediatamente, mostrar error
      setTimeout(() => {
        console.log('⏱️ Redirecting to login after 2 seconds');
        this.router.navigate(['/login']);
      }, 2000);
      return;
    }
    
    this.editData = { ...this.user };
    console.log('✅ User loaded successfully');
  }

  ngOnInit() {
    console.log('🚀 MiPerfil ngOnInit');
    if (typeof window === 'undefined') return;
    
    try {
      const all = JSON.parse(localStorage.getItem('mockPosts') || '[]');
      const nombreUsuario = this.user?.nombreUsuario;
      this.myPosts = all.filter((p: any) => p.author === nombreUsuario).slice(0, 3);
      console.log('📄 Posts loaded:', this.myPosts.length);
    } catch (err) {
      console.error('Error loading posts:', err);
    }
  }

  guardarCambios() {
    console.log('💾 Guardando cambios...');
    if (!this.user?._id) {
      console.error('No user ID');
      return;
    }

    this.userService.updateProfile(this.user._id, this.editData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Perfil actualizado:', updatedUser);
        this.user = updatedUser;
        this.auth.saveLocalUser(updatedUser);
        this.mostrarModal = false;
        alert('Perfil actualizado!');
      },
      error: (err) => {
        console.error('❌ Error al actualizar:', err);
        alert('Error al actualizar');
      }
    });
  }
}

