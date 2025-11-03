import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PortfolioSummary } from '../../../../core/models/investment-data.model';

@Component({
  selector: 'app-distribution-chart',
  templateUrl: './distribution-chart.component.html',
  styleUrls: ['./distribution-chart.component.scss']
})
export class DistributionChartComponent implements OnInit, OnChanges {
  @Input() data!: PortfolioSummary;

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

    const typeMap = new Map<string, number>();

    this.data.investments.forEach(inv => {
      const current = typeMap.get(inv.type) || 0;
      typeMap.set(inv.type, current + inv.value);
    });

    this.chartData = {
      labels: Array.from(typeMap.keys()),
      datasets: [
        {
          data: Array.from(typeMap.values()),
          label: 'Valor por Tipo',
          backgroundColor: '#1A3B7A',
          borderColor: '#1A3B7A'
        }
      ]
    };
  }
}

