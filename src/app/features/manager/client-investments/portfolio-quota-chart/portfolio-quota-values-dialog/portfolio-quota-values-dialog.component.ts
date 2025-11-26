import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PortfolioQuotaData } from '../../../../../core/models/investment-data.model';

export interface PortfolioQuotaValuesDialogData {
  quotaData: PortfolioQuotaData[];
}

@Component({
  selector: 'app-portfolio-quota-values-dialog',
  templateUrl: './portfolio-quota-values-dialog.component.html',
  styleUrls: ['./portfolio-quota-values-dialog.component.scss']
})
export class PortfolioQuotaValuesDialogComponent implements OnInit {
  sortedQuotaData: PortfolioQuotaData[] = [];
  displayedColumns: string[] = ['date', 'quotaValue'];

  constructor(
    public dialogRef: MatDialogRef<PortfolioQuotaValuesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PortfolioQuotaValuesDialogData
  ) {}

  ngOnInit(): void {
    // Ordenar por data
    this.sortedQuotaData = [...this.data.quotaData].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  formatValue(value: number): string {
    return value.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 15
    });
  }

  getMinValue(): number {
    if (this.sortedQuotaData.length === 0) return 0;
    return Math.min(...this.sortedQuotaData.map(q => q.quotaValue));
  }

  getMaxValue(): number {
    if (this.sortedQuotaData.length === 0) return 0;
    return Math.max(...this.sortedQuotaData.map(q => q.quotaValue));
  }

  getAverageValue(): number {
    if (this.sortedQuotaData.length === 0) return 0;
    const sum = this.sortedQuotaData.reduce((acc, q) => acc + q.quotaValue, 0);
    return sum / this.sortedQuotaData.length;
  }

  close(): void {
    this.dialogRef.close();
  }
}

