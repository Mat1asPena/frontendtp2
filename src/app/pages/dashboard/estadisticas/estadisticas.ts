import { Component, OnInit, inject, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js'; 
import { StatsService } from '../../../core/services/stats.service';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 

Chart.register(...registerables); 

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule, DatePipe],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css'],
})
export class Estadisticas implements OnInit {
  // Configuración de fechas
  startDate = this.getFormattedDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  endDate = this.getFormattedDate(new Date());

  // Variables de estado
  isAdmin = false;
  isLoading = true;
  error = '';

  // 1. Usamos ChartData<ChartType> para evitar conflictos en el template con el [type] dinámico
  public barChartData!: ChartData<ChartType>;
  public lineChartData!: ChartData<ChartType>;
  public doughnutChartData!: ChartData<ChartType>;

  // Tipos de Gráficos (se mantienen específicos)
  public barChartType: ChartType = 'bar';
  public lineChartType: ChartType = 'line';
  public doughnutChartType: ChartType = 'doughnut';
  
  public chartOptions: ChartConfiguration['options'] = { responsive: true };

  private statsService = inject(StatsService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  ngOnInit() {
    const user = this.authService.getUser();
    if (user?.perfil !== 'administrador') {
      this.router.navigate(['/publicaciones']);
      return;
    }
    this.isAdmin = true;
    this.loadAllStats();
  }

  getFormattedDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadAllStats() {
    this.isLoading = true;
    const { startDate, endDate } = this;
    
    this.statsService.getPostsPerUser().subscribe(data => {
        this.barChartData = this.mapPostsPerUser(data);
        this.cdr.markForCheck();
    });

    this.statsService.getCommentsPerPost(startDate, endDate).subscribe(data => {
        this.doughnutChartData = this.mapCommentsPerPost(data);
        this.cdr.markForCheck();
    });

    this.statsService.getLikesByDate(startDate, endDate).subscribe({
        next: (data) => {
            this.lineChartData = this.mapActivityData(data, 'totalLikes', 'Likes Diarios');
            this.isLoading = false;
            this.cdr.markForCheck();
        },
        error: (err) => {
            this.error = 'Error cargando datos de actividad.';
            this.isLoading = false;
            this.cdr.markForCheck();
        }
    });
  }
  
  // --- Mapeo de Datos (Usando Casteo para el retorno) ---
  mapPostsPerUser(data: any[]): ChartData<ChartType> {
    return {
      labels: data.map(item => `@${item._id}`),
      datasets: [{
        data: data.map(item => item.totalPosts),
        label: 'Publicaciones',
        backgroundColor: 'rgba(46, 89, 57, 0.7)'
      }]
    } as ChartData<ChartType>;
  }

  mapCommentsPerPost(data: any[]): ChartData<ChartType> {
    return {
      labels: data.map(item => item.titulo.slice(0, 20) + '...'),
      datasets: [{
        data: data.map(item => item.totalComments),
        label: 'Comentarios',
        backgroundColor: ['#2e5939', '#588157', '#a3b18a', '#dad7cd', '#7da37d', '#b8d5b8'] 
      }]
    } as ChartData<ChartType>;
  }

  mapActivityData(data: any[], dataKey: string, label: string): ChartData<ChartType> {
    return {
      labels: data.map(item => item._id),
      datasets: [{
        data: data.map(item => item[dataKey]),
        label: label,
        borderColor: 'rgb(46, 89, 57)',
        backgroundColor: 'rgba(46, 89, 57, 0.2)',
        fill: true,
        tension: 0.4
      }]
    } as ChartData<ChartType>;
  }
  
  onRangeChange() {
      if (this.startDate && this.endDate && this.startDate <= this.endDate) {
          this.error = '';
          this.loadAllStats();
      } else if (this.startDate > this.endDate) {
          this.error = "La fecha de inicio no puede ser posterior a la fecha final.";
          this.cdr.markForCheck();
      }
  }
}