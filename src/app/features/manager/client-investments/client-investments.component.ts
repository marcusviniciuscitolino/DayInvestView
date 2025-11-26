import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { PortfolioSummary, InvestmentData, MovementData, PortfolioQuotaData } from '../../../core/models/investment-data.model';
import { User } from '../../../core/models/user.model';
import usersData from '../../../../assets/data/users.json';

@Component({
  selector: 'app-client-investments',
  templateUrl: './client-investments.component.html',
  styleUrls: ['./client-investments.component.scss']
})
export class ClientInvestmentsComponent implements OnInit {
  investors: User[] = [];
  selectedInvestor: User | null = null;
  portfolio: PortfolioSummary | null = null;
  movements: MovementData[] = [];
  quotaData: PortfolioQuotaData[] = [];
  loading = false;

  constructor(
    private dataService: DataService,
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
    this.loadInvestments(investor.id);
  }

  loadInvestments(userId: string): void {
    this.loading = true;
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
      this.loading = false;
    });
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

  displayedColumns: string[] = ['name', 'value', 'return', 'returnPercentage', 'date', 'actions'];

  viewPosition(investment: InvestmentData): void {
    this.router.navigate(['/manager/position', this.selectedInvestor?.id, investment.name]);
  }
}

