import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, AfterViewInit } from '@angular/core';
import { PortfolioSummary, InvestmentData } from '../../../../core/models/investment-data.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';

export interface StockInfo {
  name: string;
  value: number;
  return: number;
  returnPercentage: number;
}

@Component({
  selector: 'app-stocks-info',
  templateUrl: './stocks-info.component.html',
  styleUrls: ['./stocks-info.component.scss']
})
export class StocksInfoComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() data!: PortfolioSummary;
  @ViewChild(MatSort) sort!: MatSort;

  stocks: StockInfo[] = [];
  bestReturnPercentage: StockInfo | null = null;
  bestReturnValue: StockInfo | null = null;
  
  displayedColumns: string[] = ['name', 'value', 'return', 'returnPercentage'];
  dataSource = new MatTableDataSource<StockInfo>();

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.processData();
    }
  }

  private processData(): void {
    if (!this.data || !this.data.investments || this.data.investments.length === 0) {
      this.stocks = [];
      this.bestReturnPercentage = null;
      this.bestReturnValue = null;
      this.updateTable();
      return;
    }

    // Filtrar apenas ações
    const actions = this.data.investments.filter(inv => {
      const type = this.normalizeType(inv.type);
      return type === 'Ações';
    });

    // Converter para StockInfo
    this.stocks = actions.map(inv => ({
      name: inv.name,
      value: inv.value,
      return: inv.return,
      returnPercentage: inv.value > 0 ? (inv.return / inv.value) * 100 : 0
    }));

    // Encontrar ação com maior rendimento percentual
    this.bestReturnPercentage = this.stocks.reduce((best, stock) => {
      return stock.returnPercentage > (best?.returnPercentage || 0) ? stock : best;
    }, this.stocks[0] || null);

    // Encontrar ação com maior valor retornado
    this.bestReturnValue = this.stocks.reduce((best, stock) => {
      return stock.return > (best?.return || 0) ? stock : best;
    }, this.stocks[0] || null);

    this.updateTable();
  }

  ngAfterViewInit(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
      // Ordenar inicialmente por valor investido (decrescente)
      setTimeout(() => {
        this.sort.sort({ id: 'value', start: 'desc', disableClear: false });
      });
    }
  }

  private updateTable(): void {
    // Ordenar inicialmente por valor investido (decrescente)
    const sortedData = [...this.stocks].sort((a, b) => b.value - a.value);
    this.dataSource.data = sortedData;
    
    // Se o sort já foi inicializado, aplicar novamente
    if (this.sort && this.dataSource.sort) {
      setTimeout(() => {
        this.sort.sort({ id: 'value', start: 'desc', disableClear: false });
      });
    }
  }

  private normalizeType(type: string): string {
    if (type === 'AÃ§Ãµes' || type.includes('Ã§') || type === 'Ações' || type === 'Acoes') {
      return 'Ações';
    }
    return type;
  }
}

