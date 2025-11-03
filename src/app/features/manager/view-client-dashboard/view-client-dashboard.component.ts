import { Component, OnInit } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PortfolioSummary } from '../../../core/models/investment-data.model';
import { DashboardConfig, ChartConfig } from '../../../core/models/dashboard-config.model';
import { Theme } from '../../../core/models/theme.model';
import { User } from '../../../core/models/user.model';
import usersData from '../../../../assets/data/users.json';

@Component({
  selector: 'app-view-client-dashboard',
  templateUrl: './view-client-dashboard.component.html',
  styleUrls: ['./view-client-dashboard.component.scss']
})
export class ViewClientDashboardComponent implements OnInit {
  investors: User[] = [];
  selectedInvestor: User | null = null;
  portfolio: PortfolioSummary | null = null;
  config: DashboardConfig | null = null;
  theme: Theme | null = null;
  loading = false;

  constructor(
    private dataService: DataService,
    private dashboardConfigService: DashboardConfigService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadInvestors();
  }

  loadInvestors(): void {
    this.investors = (usersData as any).users.filter((u: User) => u.role === 'investor');
  }

  onInvestorSelected(investor: User): void {
    this.selectedInvestor = investor;
    this.loadDashboard(investor.id);
  }

  loadDashboard(userId: string): void {
    this.loading = true;
    this.portfolio = null;
    this.config = null;
    this.theme = null;

    this.dataService.getInvestorData(userId).subscribe(portfolio => {
      this.portfolio = portfolio;
    });

    this.dashboardConfigService.getUserConfig(userId).subscribe(config => {
      if (config) {
        this.config = config;
        this.themeService.getThemeById(config.themeId).subscribe(theme => {
          this.theme = theme;
          this.applyTheme(theme);
        });
      } else {
        this.themeService.getPredefinedThemes().subscribe(themes => {
          if (themes.length > 0) {
            this.theme = themes[0];
            this.applyTheme(themes[0]);
          }
        });
      }
      this.loading = false;
    });
  }

  applyTheme(theme: Theme | null): void {
    if (theme) {
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      document.documentElement.style.setProperty('--accent-color', theme.accentColor);
      document.documentElement.style.setProperty('--background-color', theme.backgroundColor);
      document.documentElement.style.setProperty('--text-color', theme.textColor);
    }
  }

  getChartConfig(chartId: string): ChartConfig | null {
    return this.config?.chartTypes.find(c => c.id === chartId) || null;
  }

  hasNoCharts(): boolean {
    return this.config !== null && (!this.config.chartTypes || this.config.chartTypes.length === 0);
  }

  getFilteredPortfolio(chartId: string): PortfolioSummary | null {
    if (!this.portfolio || !this.config) return null;
    
    const chartConfig = this.getChartConfig(chartId);
    if (!chartConfig) return null;

    // Se não há filtros definidos, retorna todos os investimentos
    if (!chartConfig.filterTypes || chartConfig.filterTypes.length === 0) {
      return this.portfolio;
    }

    // Normaliza os tipos de filtro para garantir correspondência
    const normalizedFilterTypes = chartConfig.filterTypes.map(type => {
      if (type === 'AÃ§Ãµes' || type.includes('Ã§') || type === 'Acoes') return 'Ações';
      return type;
    });

    // Função auxiliar para normalizar tipo de investimento
    const normalizeInvestmentType = (type: string): string => {
      if (type === 'AÃ§Ãµes' || type.includes('Ã§') || type === 'Acoes') return 'Ações';
      if (type === 'Fundos' || type === 'Fundo') return 'Fundos';
      if (type === 'Tesouro' || type?.includes('Tesouro')) return 'Tesouro';
      return type;
    };

    // Filtra os investimentos pelos tipos selecionados
    const filteredInvestments = this.portfolio.investments.filter(
      inv => normalizedFilterTypes.includes(normalizeInvestmentType(inv.type))
    );

    // Se não há investimentos após filtrar, retorna um portfólio vazio
    if (filteredInvestments.length === 0) {
      return {
        totalValue: 0,
        totalReturn: 0,
        returnPercentage: 0,
        investments: []
      };
    }

    const totalValue = filteredInvestments.reduce((sum, inv) => sum + inv.value, 0);
    const totalReturn = filteredInvestments.reduce((sum, inv) => sum + inv.return, 0);
    const returnPercentage = totalValue > 0 ? (totalReturn / totalValue) * 100 : 0;

    return {
      totalValue,
      totalReturn,
      returnPercentage,
      investments: filteredInvestments
    };
  }
}