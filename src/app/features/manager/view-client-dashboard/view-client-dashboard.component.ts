import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { PortfolioSummary, InvestmentData, MovementData, PortfolioQuotaData } from '../../../core/models/investment-data.model';
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
  movements: MovementData[] = [];
  quotaData: PortfolioQuotaData[] = [];
  config: DashboardConfig | null = null;
  theme: Theme | null = null;
  loading = false;
  displayedColumns: string[] = ['name', 'value', 'return', 'returnPercentage', 'date', 'actions'];

  constructor(
    private dataService: DataService,
    private dashboardConfigService: DashboardConfigService,
    private themeService: ThemeService,
    private router: Router
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
    this.movements = [];
    this.quotaData = [];
    this.config = null;
    this.theme = null;

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
    if (this.selectedInvestor) {
      this.router.navigate(['/manager/position', this.selectedInvestor.id, investment.name]);
    }
  }
}