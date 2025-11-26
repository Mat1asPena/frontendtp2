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
    AdminOnlyDirective, 
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
      perfil: ['usuario', Validators.required], // Valor por defecto
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

  createUser() {
    if (this.newUserForm.invalid) {
      this.newUserForm.markAllAsTouched();
      return;
    }

    const fd = new FormData();
    Object.keys(this.newUserForm.controls).forEach(key => {
        const val = this.newUserForm.get(key)?.value;
        if (val) fd.append(key, val);
    });

    this.userService.createUser(fd).subscribe({
        next: () => {
            this.loadUsers();
            this.newUserForm.reset({ perfil: 'usuario', imagen: null });
            alert('Usuario creado con éxito');
        },
        error: (err) => alert('Error al crear usuario: ' + (err.error?.message || 'Error desconocido'))
    });
  }

  toggleUser(id: string, enable: boolean) {
    const obs = enable 
        ? this.userService.enableUser(id) 
        : this.userService.disableUser(id);
    
    obs.subscribe(() => this.loadUsers());
  }
}