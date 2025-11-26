import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { PortfolioQuotaData } from '../../../../core/models/investment-data.model';
import { PortfolioQuotaValuesDialogComponent } from './portfolio-quota-values-dialog/portfolio-quota-values-dialog.component';

@Component({
  selector: 'app-portfolio-quota-chart',
  templateUrl: './portfolio-quota-chart.component.html',
  styleUrls: ['./portfolio-quota-chart.component.scss']
})
export class PortfolioQuotaChartComponent implements OnInit, OnChanges {
  @Input() quotaData: PortfolioQuotaData[] = [];

  constructor(private dialog: MatDialog) {}

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Valor da Cota da Carteira',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y || 0;
            return `Valor: ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 15 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Data'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          callback: (value: any, index: number) => {
            const labels = this.chartData.labels as string[];
            if (labels && labels[index]) {
              // Mostrar apenas algumas datas para não sobrecarregar
              const totalLabels = labels.length;
              const step = Math.max(1, Math.floor(totalLabels / 10));
              if (index % step === 0 || index === totalLabels - 1) {
                return labels[index];
              }
              return '';
            }
            return '';
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Valor'
        },
        beginAtZero: false,
        ticks: {
          callback: (value: any) => {
            return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
          }
        }
      }
    }
  };

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quotaData']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.quotaData || this.quotaData.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Ordenar por data
    const sortedData = [...this.quotaData].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Preparar labels e valores
    const labels = sortedData.map(item => this.formatDateForDisplay(item.date));
    const values = sortedData.map(item => item.quotaValue);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          data: values,
          label: 'Valor da Cota da Carteira',
          borderColor: '#1A3B7A',
          backgroundColor: 'rgba(26, 59, 122, 0.1)',
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    };
  }

  private formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  openValuesDialog(): void {
    if (this.quotaData.length === 0) {
      return;
    }

    this.dialog.open(PortfolioQuotaValuesDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        quotaData: this.quotaData
      }
    });
  }
}

