import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MovementData } from '../../../../../core/models/investment-data.model';

export interface IrValuesDialogData {
  movements: MovementData[];
}

@Component({
  selector: 'app-ir-values-dialog',
  templateUrl: './ir-values-dialog.component.html',
  styleUrls: ['./ir-values-dialog.component.scss']
})
export class IrValuesDialogComponent implements OnInit {
  irMovements: MovementData[] = [];
  groupedByAsset: Map<string, MovementData[]> = new Map();
  displayedColumns: string[] = ['date', 'quotaValue', 'movementValue'];

  constructor(
    public dialogRef: MatDialogRef<IrValuesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IrValuesDialogData
  ) {}

  ngOnInit(): void {
    // Filtrar apenas movimentos de IR
    this.irMovements = this.data.movements.filter(m => m.movementType === 'IR');
    
    // Ordenar por data
    this.irMovements.sort((a, b) => {
      return new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime();
    });

    // Agrupar por ativo
    this.irMovements.forEach(movement => {
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
    return this.irMovements.reduce((sum, m) => sum + (m.quotaValue || 0), 0);
  }

  close(): void {
    this.dialogRef.close();
  }
}

