import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { MovementData } from '../../../../core/models/investment-data.model';
import { DividendsValuesDialogComponent } from './dividends-values-dialog/dividends-values-dialog.component';

@Component({
  selector: 'app-dividends-chart',
  templateUrl: './dividends-chart.component.html',
  styleUrls: ['./dividends-chart.component.scss']
})
export class DividendsChartComponent implements OnInit, OnChanges {
  @Input() movements: MovementData[] = [];

  constructor(private dialog: MatDialog) {}

  chartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Evolução de Dividendos ao Longo do Tempo'
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y || 0;
            return `${label}: R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            return 'R$ ' + Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        }
      }
    }
  };

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['movements']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.movements || this.movements.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Filtrar apenas movimentos de Dividendos
    const dividendsMovements = this.movements.filter(m => m.movementType === 'Dividendos');
    
    if (dividendsMovements.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Agrupar por ativo
    const assets = [...new Set(dividendsMovements.map(m => m.assetName))];
    
    // Agrupar por data e ativo
    const dataMap = new Map<string, Map<string, number>>();
    
    dividendsMovements.forEach(movement => {
      const dateKey = this.formatDate(movement.movementDate);
      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, new Map<string, number>());
      }
      const assetMap = dataMap.get(dateKey)!;
      const currentValue = assetMap.get(movement.assetName) || 0;
      // Usa quotaValue (Valor Cota Moviment) para os dividendos
      const dividendValue = movement.quotaValue || 0;
      assetMap.set(movement.assetName, currentValue + dividendValue);
    });

    // Ordenar datas
    const sortedDates = Array.from(dataMap.keys()).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Criar datasets para cada ativo
    const datasets = assets.map((asset, index) => {
      const colors = [
        'rgba(76, 175, 80, 0.8)',   // Verde (Dividendos)
        'rgba(33, 150, 243, 0.8)',  // Azul
        'rgba(255, 152, 0, 0.8)',   // Laranja
        'rgba(156, 39, 176, 0.8)',  // Roxo
        'rgba(244, 67, 54, 0.8)'    // Vermelho
      ];
      
      const data = sortedDates.map(date => {
        const assetMap = dataMap.get(date);
        return assetMap?.get(asset) || 0;
      });

      return {
        label: asset,
        data: data,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.8', '1'),
        borderWidth: 1
      };
    });

    this.chartData = {
      labels: sortedDates.map(date => this.formatDateForDisplay(date)),
      datasets: datasets
    };
  }

  private formatDate(dateStr: string): string {
    return dateStr;
  }

  private formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const month = date.toLocaleDateString('pt-BR', { month: 'short' });
    const year = date.getFullYear();
    return `${month}/${year}`;
  }

  openValuesDialog(): void {
    const dividendsMovements = this.movements.filter(m => m.movementType === 'Dividendos');
    
    if (dividendsMovements.length === 0) {
      return;
    }

    this.dialog.open(DividendsValuesDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        movements: this.movements
      }
    });
  }
}

