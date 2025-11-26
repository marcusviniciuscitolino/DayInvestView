import { Component, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { DataService } from '../../../core/services/data.service';
import { PositionData } from '../../../core/models/investment-data.model';
import { User } from '../../../core/models/user.model';
import usersData from '../../../../assets/data/users.json';

@Component({
  selector: 'app-position-daily',
  templateUrl: './position-daily.component.html',
  styleUrls: ['./position-daily.component.scss']
})
export class PositionDailyComponent implements OnInit {
  userId: string = '';
  assetName: string = '';
  user: User | null = null;
  positions: PositionData[] = [];
  loading = false;

  // Dados agrupados por ativo
  positionsByAsset: Map<string, PositionData[]> = new Map();
  totalPositions: Map<string, number> = new Map();
  displayedColumns: string[] = ['date', 'quantity', 'position'];

  // Dados do gráfico
  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Evolução da Posição ao Longo do Tempo'
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: ${this.formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value: any) => {
            return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          }
        }
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.assetName = params['assetName'] ? decodeURIComponent(params['assetName']) : '';
      this.loadUser();
      this.loadPositions();
    });
  }

  loadUser(): void {
    const users = (usersData as any).users;
    this.user = users.find((u: User) => u.id === this.userId) || null;
  }

  loadPositions(): void {
    this.loading = true;
    this.dataService.getPositionsByUserIdAndAsset(this.userId, this.assetName).subscribe(positions => {
      this.positions = positions.sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Agrupar por ativo
      this.positionsByAsset.clear();
      this.totalPositions.clear();
      
      this.positions.forEach(position => {
        if (!this.positionsByAsset.has(position.assetName)) {
          this.positionsByAsset.set(position.assetName, []);
        }
        this.positionsByAsset.get(position.assetName)!.push(position);
      });

      // Calcular totais por ativo
      this.positionsByAsset.forEach((positions, asset) => {
        const lastPosition = positions[positions.length - 1];
        this.totalPositions.set(asset, lastPosition?.position || 0);
      });

      // Preparar dados do gráfico
      this.updateChart();

      this.loading = false;
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getTotalPosition(): number {
    let total = 0;
    this.totalPositions.forEach(value => {
      total += value;
    });
    return total;
  }

  goBack(): void {
    this.router.navigate(['/manager/client-investments']);
  }

  private updateChart(): void {
    if (!this.positions || this.positions.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Agrupar posições por ativo e data
    const dataMap = new Map<string, Map<string, number>>();
    
    this.positions.forEach(position => {
      const dateKey = this.formatDateForChart(position.date);
      if (!dataMap.has(position.assetName)) {
        dataMap.set(position.assetName, new Map<string, number>());
      }
      const assetMap = dataMap.get(position.assetName)!;
      assetMap.set(dateKey, position.position);
    });

    // Obter todas as datas únicas e ordená-las
    const allDates = new Set<string>();
    dataMap.forEach((assetMap) => {
      assetMap.forEach((_, date) => allDates.add(date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => {
      return new Date(a.split('/').reverse().join('-')).getTime() - 
             new Date(b.split('/').reverse().join('-')).getTime();
    });

    // Criar datasets para cada ativo
    const colors = [
      { border: 'rgba(26, 59, 122, 1)', background: 'rgba(26, 59, 122, 0.1)' }, // Azul escuro
      { border: 'rgba(76, 175, 80, 1)', background: 'rgba(76, 175, 80, 0.1)' }, // Verde
      { border: 'rgba(244, 67, 54, 1)', background: 'rgba(244, 67, 54, 0.1)' }, // Vermelho
      { border: 'rgba(255, 152, 0, 1)', background: 'rgba(255, 152, 0, 0.1)' }, // Laranja
    ];

    const datasets = Array.from(dataMap.keys()).map((asset, index) => {
      const assetMap = dataMap.get(asset)!;
      const data = sortedDates.map(date => {
        return assetMap.get(date) || null;
      });

      const color = colors[index % colors.length];

      return {
        label: asset,
        data: data,
        borderColor: color.border,
        backgroundColor: color.background,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      };
    });

    this.chartData = {
      labels: sortedDates,
      datasets: datasets
    };
  }

  private formatDateForChart(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
}

