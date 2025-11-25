import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from '../../../core/services/stats.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Estadisticas implements OnInit {
  postsPerUser: any[] = [];
  likesByDate: any[] = [];
  totalUsers = 0;
  isLoading = true;
  isAdmin = false;
  error = '';

  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  ngOnInit() {
    const user = this.authService.getUser();
    if (user?.rol !== 'administrador') {
      // Redirigir si no es admin, aunque el backend también lo verifica
      this.router.navigate(['/publicaciones']);
      return;
    }
    this.isAdmin = true;
    this.loadStats();
  }

  loadStats() {
    const userObs = this.statsService.getTotalUsers();
    const postObs = this.statsService.getPostsPerUser();
    const likesObs = this.statsService.getLikesByDate();

    // Utilizamos Promise.all o similar para esperar las 3
    userObs.subscribe(data => { this.totalUsers = data.totalUsers; this.cdr.markForCheck(); });
    postObs.subscribe(data => { this.postsPerUser = data; this.cdr.markForCheck(); });
    likesObs.subscribe(data => { 
        this.likesByDate = data; 
        this.isLoading = false;
        this.cdr.markForCheck();
    }, (err) => {
        this.error = 'Error al cargar las estadísticas del servidor.';
        this.isLoading = false;
        this.cdr.markForCheck();
    });
  }
}