import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PortfolioSummary, InvestmentData } from '../../../../core/models/investment-data.model';

@Component({
  selector: 'app-returns-chart',
  templateUrl: './returns-chart.component.html',
  styleUrls: ['./returns-chart.component.scss']
})
export class ReturnsChartComponent implements OnInit, OnChanges {
  @Input() data!: PortfolioSummary;

  chartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right'
      },
      title: {
        display: false
      }
    }
  };

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.data || !this.data.investments || this.data.investments.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Paleta de cores organizada por tipo de investimento
    const colorPalettes: { [key: string]: string[] } = {
      'Ações': [
        '#1A3B7A', '#2E4B9A', '#4261BA', '#5677DA', '#6A8DFA',
        '#1E4A8A', '#3262AA', '#467ACA', '#5A92EA', '#6EAAFF',
        '#2254A0', '#366CC0', '#4A84E0', '#5E9CFF', '#72B4FF'
      ],
      'Fundos': [
        '#FF6B35', '#FF7A4A', '#FF8960', '#FF9875', '#FFA78B',
        '#FF5122', '#FF6244', '#FF7366', '#FF8488', '#FF95AA',
        '#FF4010', '#FF5133', '#FF6256', '#FF7379', '#FF849C'
      ],
      'Tesouro': [
        '#4CAF50', '#5CBF60', '#6CCF70', '#7CDF80', '#8CEF90',
        '#3C9F40', '#4CAF50', '#5CBF60', '#6CCF70', '#7CDF80',
        '#2C8F30', '#3C9F40', '#4CAF50', '#5CBF60', '#6CCF70'
      ]
    };

    // Separar investimentos por tipo
    const investmentsByType: { [key: string]: InvestmentData[] } = {
      'Ações': [],
      'Fundos': [],
      'Tesouro': []
    };

    this.data.investments.forEach(inv => {
      const type = this.normalizeType(inv.type);
      if (investmentsByType[type]) {
        investmentsByType[type].push(inv);
      } else {
        // Para tipos desconhecidos, usar cores neutras
        if (!investmentsByType['Ações']) investmentsByType['Ações'] = [];
        investmentsByType['Ações'].push(inv);
      }
    });

    // Gerar cores para cada investimento baseado no tipo
    const colors: string[] = [];
    const labels: string[] = [];
    const values: number[] = [];

    // Processar por ordem de tipo para melhor organização visual
    ['Ações', 'Fundos', 'Tesouro'].forEach(type => {
      investmentsByType[type].forEach((inv: InvestmentData, index: number) => {
        const palette = colorPalettes[type] || colorPalettes['Ações'];
        const colorIndex = index % palette.length;
        colors.push(palette[colorIndex]);
        labels.push(inv.name);
        values.push(inv.return);
      });
    });

    this.chartData = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }
      ]
    };

    // Melhorar as opções do gráfico para melhor visibilidade
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            padding: 12,
            font: {
              size: 12,
              weight: 'normal'
            },
            color: 'var(--text-color, #1a1a1a)',
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const percentage = this.data.totalReturn > 0 
                ? ((value / this.data.totalReturn) * 100).toFixed(2) 
                : '0.00';
              return `${label}: R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  private normalizeType(type: string): string {
    // Normaliza diferentes encodings
    if (type === 'AÃ§Ãµes' || type.includes('Ã§') || type === 'Ações' || type === 'Acoes') {
      return 'Ações';
    }
    if (type === 'Fundos' || type === 'Fundo' || type === 'Fundo Multimercad') {
      return 'Fundos';
    }
    if (type === 'Tesouro' || type === 'Tesouro Direto' || type?.includes('Tesouro')) {
      return 'Tesouro';
    }
    return 'Ações'; // Default
  }
}

