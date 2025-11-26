import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PortfolioSummary } from '../../../../core/models/investment-data.model';

@Component({
  selector: 'app-class-distribution-chart',
  templateUrl: './class-distribution-chart.component.html',
  styleUrls: ['./class-distribution-chart.component.scss']
})
export class ClassDistributionChartComponent implements OnInit, OnChanges {
  @Input() portfolio: PortfolioSummary | null = null;

  chartData: ChartConfiguration<'pie'>['data'] = {
    labels: [],
    datasets: []
  };

  chartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      title: {
        display: true,
        text: 'Distribuição por Classe',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${percentage}%`;
          }
        }
      }
    }
  };

  ngOnInit(): void {
    this.updateChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['portfolio']) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    if (!this.portfolio || !this.portfolio.investments || this.portfolio.investments.length === 0) {
      this.chartData = {
        labels: [],
        datasets: []
      };
      return;
    }

    // Mapear tipo para classe
    const classMap = new Map<string, string>();
    classMap.set('Tesouro', 'Renda Fixa');
    classMap.set('Ações', 'Renda Variável');
    classMap.set('Fundos', 'Fundos de Investimento');

    // Agrupar por classe
    const classData = new Map<string, number>();
    
    this.portfolio.investments.forEach(inv => {
      const classe = classMap.get(inv.type) || inv.type;
      const current = classData.get(classe) || 0;
      classData.set(classe, current + inv.value);
    });

    // Preparar dados do gráfico
    const labels = Array.from(classData.keys());
    const values = Array.from(classData.values());

    // Cores baseadas na imagem: azul escuro, laranja, verde escuro
    const colors = [
      '#1A3B7A',  // Azul escuro (Renda Fixa)
      '#FF6B35',   // Laranja (Fundos de Investimento)
      '#2D5016'    // Verde escuro (Renda Variável)
    ];

    this.chartData = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };
  }
}

