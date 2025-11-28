import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { DataService } from '../../../core/services/data.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PortfolioSummary, InvestmentData, MovementData, PortfolioQuotaData } from '../../../core/models/investment-data.model';
import { DashboardConfig, ChartConfig } from '../../../core/models/dashboard-config.model';
import { Theme } from '../../../core/models/theme.model';

@Component({
  selector: 'app-investor-dashboard',
  templateUrl: './investor-dashboard.component.html',
  styleUrls: ['./investor-dashboard.component.scss']
})
export class InvestorDashboardComponent implements OnInit {
  portfolio: PortfolioSummary | null = null;
  movements: MovementData[] = [];
  quotaData: PortfolioQuotaData[] = [];
  config: DashboardConfig | null = null;
  theme: Theme | null = null;
  loading = true;
  displayedColumns: string[] = ['name', 'value', 'return', 'returnPercentage', 'date', 'actions'];

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private dashboardConfigService: DashboardConfigService,
    private themeService: ThemeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Carregar e aplicar tema imediatamente se já existir configuração
      this.dashboardConfigService.getUserConfig(user.id).subscribe(config => {
        if (config) {
          this.themeService.getThemeById(config.themeId).subscribe(theme => {
            if (theme) {
              this.applyTheme(theme);
            }
          });
        }
      });
      
      this.loadDashboard(user.id);
    }
  }

  loadDashboard(userId: string): void {
    console.log('Carregando dashboard para usuário:', userId);
    this.portfolio = null;
    this.movements = [];
    this.quotaData = [];

    this.dataService.getInvestorData(userId).subscribe(portfolio => {
      this.portfolio = portfolio;
    });

    this.dataService.getMovementsByUserId(userId).subscribe(movements => {
      this.movements = movements;
    });

    this.dataService.getPortfolioQuotaByUserId(userId).subscribe(quota => {
      this.quotaData = quota;
    });

    this.dashboardConfigService.getUserConfig(userId).subscribe(config => {
      console.log('Configuração carregada:', config);
      if (config) {
        this.config = config;
        console.log('Buscando tema com ID:', config.themeId);
        this.themeService.getThemeById(config.themeId).subscribe(theme => {
          console.log('Tema encontrado:', theme);
          this.theme = theme;
          this.applyTheme(theme);
        });
      } else {
        console.log('Nenhuma configuração encontrada, usando tema padrão');
        this.themeService.getPredefinedThemes().subscribe(themes => {
          if (themes.length > 0) {
            this.theme = themes[0];
            console.log('Usando tema padrão:', themes[0]);
            this.applyTheme(themes[0]);
          }
        });
      }
      this.loading = false;
    });
  }

  applyTheme(theme: Theme | null): void {
    if (theme) {
      console.log('Aplicando tema:', theme);
      const root = document.documentElement;
      root.style.setProperty('--primary-color', theme.primaryColor);
      root.style.setProperty('--accent-color', theme.accentColor);
      root.style.setProperty('--background-color', theme.backgroundColor);
      root.style.setProperty('--text-color', theme.textColor);
      
      // Também aplicar no body para garantir que o background funcione
      document.body.style.setProperty('background-color', theme.backgroundColor);
      document.body.style.setProperty('color', theme.textColor);
      
      console.log('Variáveis CSS aplicadas:', {
        '--primary-color': theme.primaryColor,
        '--accent-color': theme.accentColor,
        '--background-color': theme.backgroundColor,
        '--text-color': theme.textColor
      });
    } else {
      console.warn('Tentativa de aplicar tema nulo');
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

  getInvestmentsByType(type: string): InvestmentData[] {
    if (!this.portfolio) return [];
    return this.portfolio.investments.filter(inv => inv.type === type);
  }

  getUniqueTypes(): string[] {
    if (!this.portfolio) return [];
    const types = this.portfolio.investments.map(inv => inv.type);
    return [...new Set(types)];
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Ações':
        return 'trending_up';
      case 'Tesouro':
        return 'account_balance';
      case 'Fundos':
        return 'pie_chart';
      default:
        return 'attach_money';
    }
  }

  getTypeTotal(type: string): number {
    if (!this.portfolio) return 0;
    return this.getInvestmentsByType(type).reduce((sum, inv) => sum + inv.value, 0);
  }

  viewPosition(investment: InvestmentData): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.router.navigate(['/manager/position', user.id, investment.name]);
    }
  }
}

