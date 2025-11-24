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
      nombre: ['', [Validators.required], Validators.maxLength(100)],
      apellido: ['', [Validators.required, Validators.maxLength(75)]],
      correo: ['', [Validators.required, Validators.email, Validators.maxLength(70)]],
      nombreUsuario: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100),
        Validators.pattern(/(?=.*[A-Z])(?=.*\d).+/) 
      ]],
      confirmPassword: [''],
      fechaNacimiento: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      descripcion: ['', [Validators.maxLength(300)]] ,
      imagen: [null, [Validators.required ]] // <-- Agregado Validators.required
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true; 
    const fd = new FormData(); 

    fd.append('nombre', this.form.get('nombre')?.value);
    fd.append('apellido', this.form.get('apellido')?.value);
    fd.append('correo', this.form.get('correo')?.value);
    fd.append('nombreUsuario', this.form.get('nombreUsuario')?.value);
    fd.append('password', this.form.get('password')?.value);
    fd.append('fechaNacimiento', this.form.get('fechaNacimiento')?.value);
    fd.append('descripcion', this.form.get('descripcion')?.value || '');
    fd.append('perfil', 'usuario'); 

    const file = this.form.get('imagen')?.value;
    if (file instanceof File) fd.append('imagen', file);

    this.auth.register(fd).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.user) this.auth.saveLocalUser(res.user);
        if (res.token) localStorage.setItem('token', res.token);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Error al registrar';
      },
    });
  }
}