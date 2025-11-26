import { Component, OnInit, inject } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminOnlyDirective } from '../../../shared/directives/admin-only.directive';
import { RolePipe } from '../../../shared/pipes/role.pipe';
import { ImgErrorDirective } from '../../../shared/directives/image-error.directive';
import { DefaultImgPipe } from '../../../shared/pipes/default-img.pipe';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RolePipe, 
    ImgErrorDirective,
    DefaultImgPipe 
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})

export class Usuarios implements OnInit {
  users: any[] = [];
  error = '';
  newUserForm: FormGroup;
  
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private auth = inject(AuthService);

  constructor() {
    this.newUserForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', Validators.required], 
      password: ['', [Validators.required, Validators.minLength(8)]], 
      fechaNacimiento: ['', Validators.required],
      perfil: ['usuario', Validators.required],
      imagen: [null]
    });
  }

  ngOnInit() {
    const me = this.auth.getUser();
    if (me?.perfil !== 'administrador') {
        this.error = 'No tienes permisos de administrador.';
        return;
    }
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe({
        next: (res) => this.users = res,
        error: (err) => this.error = 'Error al cargar usuarios'
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
        this.newUserForm.patchValue({ imagen: input.files[0] });
    }
  }

  // LÓGICA DE CREACIÓN DE USUARIO CON MEJOR MANEJO DE ERRORES
  createUser() {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }

    const fd = new FormData();
    Object.keys(this.newUserForm.controls).forEach(key => {
        const control = this.newUserForm.get(key);
        const val = control?.value;
        
        // El campo 'imagen' es un archivo, lo manejamos explícitamente
        if (key === 'imagen' && val instanceof File) {
            fd.append(key, val, val.name);
        } else if (key !== 'imagen' && val !== null && val !== undefined) {
            // El resto de campos (incluyendo nombreUsuario y password)
            fd.append(key, val);
        }
    });

    console.log('Intentando crear usuario con FormData...');

    this.userService.createUser(fd).subscribe({
        next: () => {
            this.loadUsers();
            this.newUserForm.reset({ perfil: 'usuario', imagen: null });
            alert('Usuario creado con éxito');
        },
        error: (err) => {
            // Lógica para mostrar mensajes de error más útiles
            const backendError = err.error?.message;
            let errorMessage = 'Error desconocido al crear el usuario.';

            if (typeof backendError === 'string' && backendError.includes('Correo o nombre de usuario ya en uso')) {
                errorMessage = 'Error: Ya existe un usuario o correo con esa información. Por favor, intente con otros valores.';
            } else if (Array.isArray(backendError)) {
                // Errores de validación de NestJS (ej. minLength)
                errorMessage = 'Error de validación: ' + backendError.join('. ');
            } else if (backendError) {
                errorMessage = 'Error del servidor: ' + backendError;
            }
            
            alert(errorMessage);
            this.newUserForm.markAllAsTouched(); // Asegura que se vean los errores de validación si los hay
        }
    });
  }

  toggleUser(id: string, enable: boolean) {
    const obs = enable 
        ? this.userService.enableUser(id) 
        : this.userService.disableUser(id);
    
    obs.subscribe(() => this.loadUsers());
  }
}