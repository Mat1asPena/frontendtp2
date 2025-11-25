import { Component, signal, OnInit, inject, PLATFORM_ID, Inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { AuthService } from './core/services/auth.service';
import { Modal } from './shared/components/modal/modal';
import { Loading } from './shared/components/loading/loading';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer, Modal, Loading],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');

  auth = inject(AuthService);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  ngZone = inject(NgZone);

  // --- VARIABLES NUEVAS ---
  isLoading = true; // Empieza en true para mostrar el spinner al inicio
  isBrowser: boolean;

  // --- VARIABLES EXISTENTES ---
  showSessionModal = false;
  sessionTimer: any;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.initializeApp();
    } else {
      this.isLoading = false;
    }
  }

  // --- LÓGICA DE ARRANQUE ---
  async initializeApp() {
    try {
      console.log('🚀 Iniciando validación de token...');
      // Timeout de seguridad de 2 segundos
      const validationPromise = this.auth.validateToken().toPromise();
      const timeoutPromise = new Promise<boolean>(resolve => 
        setTimeout(() => {
          console.warn('⏱️ Timeout en validación');
          resolve(false);
        }, 2000)
      );

      const isValid = await Promise.race([validationPromise, timeoutPromise]);
      console.log('📊 Resultado de validación:', isValid);
      
      // Solo actualizar isLoading - dejar que los Guards manejen la navegación
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
        console.log('✅ Spinner desactivado - Guards manejarán la navegación');
      });
    } catch (error) {
      console.error('💥 Error en inicialización:', error);
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    }
  }

  startSessionTimer() {
    this.sessionTimer = setTimeout(() => {
        this.showSessionModal = true;
    }, 600000); // 10 minutos
  }

  refreshToken() {
    this.auth.refreshToken().subscribe({
        next: () => {
            this.showSessionModal = false;
            clearTimeout(this.sessionTimer);
            this.startSessionTimer(); // Reiniciar timer
        },
        error: () => this.logout()
    });
  }

  logout() {
    this.showSessionModal = false;
    this.auth.logout();
    this.router.navigate(['/login']); 
  }
}