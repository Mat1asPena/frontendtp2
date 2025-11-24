import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  form: any;
  errorMsg = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      identifier: ['testuser', [Validators.required]], // usuario de prueba
      password: ['password123', [Validators.required]] // contraseña de prueba
    });
  }

  submit() {
    console.log('📝 Submitting login form');
    if (this.form.invalid) { 
      console.log('❌ Form invalid');
      this.form.markAllAsTouched(); 
      return; 
    }
    this.loading = true;
    const payload = { usernameOrEmail: this.form.value.identifier, password: this.form.value.password };
    console.log('📤 Sending payload:', payload);
    this.auth.login(payload).subscribe({
      next: (res) => {
        console.log('✅ Login successful, navigating to publicaciones');
        this.loading = false;
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        console.error('❌ Login error:', err);
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Credenciales inválidas';
      }
    });
  }
}
