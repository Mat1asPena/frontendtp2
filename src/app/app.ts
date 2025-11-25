import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Footer } from './shared/components/footer/footer';
import { AuthService } from './core/services/auth.service';
import { Modal } from './shared/components/modal/modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Modal],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  protected readonly title = signal('frontend');

  auth = inject(AuthService);
  showSessionModal = false;
  sessionTimer: any;

  ngOnInit() {
    if (this.auth.isLogged()) {
        this.startSessionTimer();
    }
  }

  startSessionTimer() {
    // El enunciado dice: a los 10 minutos avisar (600000 ms)
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
    window.location.reload();
  }
}
