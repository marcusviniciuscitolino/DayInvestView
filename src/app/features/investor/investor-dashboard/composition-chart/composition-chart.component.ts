import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { PortfolioSummary } from '../../../../core/models/investment-data.model';

@Component({
  selector: 'app-composition-chart',
  templateUrl: './composition-chart.component.html',
  styleUrls: ['./composition-chart.component.scss']
})
export class CompositionChartComponent implements OnInit, OnChanges {
  @Input() data!: PortfolioSummary;

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

    const colors = [
      '#1A3B7A', '#2A4B8A', '#3A5B9A', '#4A6BAA', '#5A7BBA',
      '#6A8BCA', '#7A9BDA', '#8AABEA', '#9ABEFA', '#AACEFA',
      '#BAEEFA', '#CAFEFA', '#DAFFFA', '#EAFFFA', '#FAFFFA',
      '#1A4B9A', '#2A5BAA', '#3A6BBA', '#4A7BCA', '#5A8BDA'
    ];

    this.chartData = {
      labels: this.data.investments.map(inv => inv.name),
      datasets: [
        {
          data: this.data.investments.map(inv => inv.value),
          backgroundColor: colors.slice(0, this.data.investments.length)
        }
      ]
    };
  }
}

