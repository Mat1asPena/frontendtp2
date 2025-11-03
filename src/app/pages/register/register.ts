import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

function passwordValidator(controlName: string) {
  return (fg: FormGroup) => {
    const pass = fg.get('password')?.value;
    const pass2 = fg.get('confirmPassword')?.value;
    if (pass !== pass2) fg.get('confirmPassword')?.setErrors({ mismatch: true });
    else fg.get('confirmPassword')?.setErrors(null);
    return null;
  };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  form: FormGroup;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(8),
        Validators.pattern(/(?=.*[A-Z])(?=.*\d).+/) // al menos 1 mayúscula y 1 número
      ]],
      confirmPassword: [''],
      fechaNacimiento: ['', [Validators.required]],
      descripcion: [''],
      imagen: [null]
    }, { validators: passwordValidator('password') });
  }

  imagenPreview: string | ArrayBuffer | null = null;
  loading = false;
  errorMsg = '';

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.form.patchValue({ imagen: file });
    const reader = new FileReader();
    reader.onload = () => this.imagenPreview = reader.result;
    reader.readAsDataURL(file);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const fd = new FormData();
    Object.entries(this.form.value).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      if (k === 'imagen') {
        if (v instanceof File) fd.append('imagen', v);
      } else {
        fd.append(k, v as any);
      }
    });
    // agregar rol por defecto
    fd.append('rol', 'usuario');

    this.auth.register(fd).subscribe({
      next: (res) => {
        this.loading = false;
        // en sprint1 podemos guardar user en localStorage si la API no lo hace
        if (res.user) this.auth.saveLocalUser(res.user);
        // si el backend devuelve token guardarlo
        if (res.token) localStorage.setItem('token', res.token);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Error al registrar';
      }
    });
  }
}
