import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PortfolioSummary } from '../../../../core/models/investment-data.model';

@Component({
  selector: 'app-strategy-distribution-chart',
  templateUrl: './strategy-distribution-chart.component.html',
  styleUrls: ['./strategy-distribution-chart.component.scss']
})
export class StrategyDistributionChartComponent implements OnInit, OnChanges {
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
        text: 'Distribuição por Estratégia',
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

    // Mapear ativos para estratégia
    // NTN-B e PETR25 são títulos indexados à inflação -> Inflação
    // BOGARI VALUE ADV FC FIA e PETR4 são ações -> Ação
    const strategyMap = new Map<string, string>();
    
    this.portfolio.investments.forEach(inv => {
      let strategy = 'Ação';
      if (inv.name.includes('NTN-B') || inv.name === 'PETR25') {
        strategy = 'Inflação';
      }
      strategyMap.set(inv.name, strategy);
    });

    // Agrupar por estratégia
    const strategyData = new Map<string, number>();
    strategyData.set('Inflação', 0);
    strategyData.set('Ação', 0);
    
    this.portfolio.investments.forEach(inv => {
      const strategy = strategyMap.get(inv.name) || 'Ação';
      const current = strategyData.get(strategy) || 0;
      strategyData.set(strategy, current + inv.value);
    });

    // Preparar dados do gráfico
    const labels = Array.from(strategyData.keys());
    const values = Array.from(strategyData.values());

    // Cores baseadas na imagem: azul escuro e laranja
    const colors = [
      '#1A3B7A',  // Azul escuro (Inflação)
      '#FF6B35'   // Laranja (Ação)
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

