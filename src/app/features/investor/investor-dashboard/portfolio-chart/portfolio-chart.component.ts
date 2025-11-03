import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PortfolioSummary } from '../../../../core/models/investment-data.model';

@Component({
  selector: 'app-portfolio-chart',
  templateUrl: './portfolio-chart.component.html',
  styleUrls: ['./portfolio-chart.component.scss']
})
export class PortfolioChartComponent implements OnInit, OnChanges {
  @Input() data!: PortfolioSummary;

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

    const labels = this.data.investments.map((_, index) => `Mês ${index + 1}`);
    const values: number[] = [];
    let cumulative = 0;

    this.data.investments.forEach(inv => {
      cumulative += inv.value;
      values.push(cumulative);
    });

    this.chartData = {
      labels,
      datasets: [
        {
          data: values,
          label: 'Patrimônio Total',
          borderColor: '#1A3B7A',
          backgroundColor: 'rgba(26, 59, 122, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }
}

