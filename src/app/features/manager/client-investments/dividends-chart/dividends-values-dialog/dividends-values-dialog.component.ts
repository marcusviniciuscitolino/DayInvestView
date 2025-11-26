import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MovementData } from '../../../../../core/models/investment-data.model';

export interface DividendsValuesDialogData {
  movements: MovementData[];
}

@Component({
  selector: 'app-dividends-values-dialog',
  templateUrl: './dividends-values-dialog.component.html',
  styleUrls: ['./dividends-values-dialog.component.scss']
})
export class DividendsValuesDialogComponent implements OnInit {
  dividendsMovements: MovementData[] = [];
  groupedByAsset: Map<string, MovementData[]> = new Map();
  displayedColumns: string[] = ['date', 'quotaValue', 'movementValue'];

  constructor(
    public dialogRef: MatDialogRef<DividendsValuesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DividendsValuesDialogData
  ) {}

  ngOnInit(): void {
    // Filtrar apenas movimentos de Dividendos
    this.dividendsMovements = this.data.movements.filter(m => m.movementType === 'Dividendos');
    
    // Ordenar por data
    this.dividendsMovements.sort((a, b) => {
      return new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime();
    });

    // Agrupar por ativo
    this.dividendsMovements.forEach(movement => {
      if (!this.groupedByAsset.has(movement.assetName)) {
        this.groupedByAsset.set(movement.assetName, []);
      }
      this.groupedByAsset.get(movement.assetName)!.push(movement);
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

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  getTotalByAsset(assetName: string): number {
    const movements = this.groupedByAsset.get(assetName) || [];
    return movements.reduce((sum, m) => sum + (m.quotaValue || 0), 0);
  }

  getGrandTotal(): number {
    return this.dividendsMovements.reduce((sum, m) => sum + (m.quotaValue || 0), 0);
  }

  close(): void {
    this.dialogRef.close();
  }
}

