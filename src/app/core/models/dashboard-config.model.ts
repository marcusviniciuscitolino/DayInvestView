export interface DashboardConfig {
  id: string;
  userId: string;
  themeId: string;
  chartTypes: ChartConfig[];
  layout: string;
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'stocks' | 'portfolio-quota' | 'interest' | 'ir' | 'dividends' | 'class-distribution' | 'strategy-distribution';
  title: string;
  dataSource: string;
  position: number;
  filterTypes?: string[]; // Tipos de investimento a exibir: ['Ações', 'Fundos', 'Tesouro']
}

