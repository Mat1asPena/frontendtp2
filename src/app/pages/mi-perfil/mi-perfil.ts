import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; // Importamos ReactiveFormsModule
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { PostService, PostFront } from '../../core/services/posts.service';
import { Modal } from '../../shared/components/modal/modal';

@Component({
  selector: 'app-mi-perfil',
  standalone: true,
  imports: [CommonModule, Modal, ReactiveFormsModule], // Usamos ReactiveFormsModule en lugar de FormsModule
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.css',
})
export class MiPerfil implements OnInit {
  user: any = null;
  myPosts: PostFront[] = [];
  
  // Variables del Modal Edición
  mostrarModal = false;
  editForm!: FormGroup; // Formulario Reactivo
  imagePreview: string | ArrayBuffer | null = null; // Para previsualizar nueva imagen

  // Variables Modal Mensajes
  showMsgModal = false;
  msgTitle = '';
  msgText = '';
  
  isBrowser: boolean;

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private postService: PostService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder, // Inyectamos FormBuilder
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    
    // Inicializamos el formulario con validaciones
    this.editForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: ['', [Validators.maxLength(200)]],
      imagen: [null] // Campo para el archivo
    });

    if (this.isBrowser) {
      this.user = this.auth.getUser();
      if (this.user) {
        // Rellenamos el formulario con los datos actuales
        this.editForm.patchValue({
          nombre: this.user.nombre,
          apellido: this.user.apellido,
          descripcion: this.user.descripcion
        });
      }
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }
      this.loadMyPosts();
    }
  }

  // Abrir modal y resetear valores al actual
  abrirEdicion() {
    this.editForm.patchValue({
      nombre: this.user.nombre,
      apellido: this.user.apellido,
      descripcion: this.user.descripcion
    });
    this.imagePreview = null; // Limpiar preview
    this.mostrarModal = true;
  }

  // Detectar cambio de archivo
  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      this.editForm.patchValue({ imagen: file });
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  loadMyPosts() {
    this.postService.getPosts('fecha', 3, 1, this.user.nombreUsuario).subscribe({
      next: (posts) => {
        this.myPosts = posts;
        this.cdr.detectChanges();
      },
      error: (err) => console.error(err)
    });
  }

  openMsgModal(title: string, text: string) {
    this.msgTitle = title;
    this.msgText = text;
    this.showMsgModal = true;
    this.cdr.detectChanges();
  }

  guardarCambios() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    
    if (!this.user?._id) return;

    // Crear FormData para enviar texto + archivo
    const fd = new FormData();
    fd.append('nombre', this.editForm.get('nombre')?.value);
    fd.append('apellido', this.editForm.get('apellido')?.value);
    fd.append('descripcion', this.editForm.get('descripcion')?.value || '');
    
    const file = this.editForm.get('imagen')?.value;
    if (file instanceof File) {
        fd.append('imagen', file);
    }

    this.userService.updateProfile(this.user._id, fd).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.auth.saveLocalUser(updatedUser); // Actualizar localStorage
        this.mostrarModal = false;
        this.openMsgModal('¡Perfil Actualizado!', 'Tus datos se han guardado correctamente.');
      },
      error: (err) => {
        console.error('❌ Error al actualizar:', err);
        this.openMsgModal('Error', 'No se pudo actualizar el perfil.');
      }
    });
  }
}