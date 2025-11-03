import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InvestmentData, PortfolioSummary } from '../models/investment-data.model';
import investmentData from '../../../assets/data/investments.json';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  getInvestorData(userId: string): Observable<PortfolioSummary> {
    let data: InvestmentData[] = (investmentData as any).investments.filter(
      (inv: InvestmentData) => inv.userId === userId
    );
    
    // Normalizar tipos de investimento (corrige problemas de encoding)
    data = data.map(inv => ({
      ...inv,
      type: this.normalizeInvestmentType(inv.type)
    }));
    
    const totalValue = data.reduce((sum, inv) => sum + inv.value, 0);
    const totalReturn = data.reduce((sum, inv) => sum + inv.return, 0);
    const returnPercentage = totalValue > 0 ? (totalReturn / totalValue) * 100 : 0;

    return of({
      totalValue,
      totalReturn,
      returnPercentage,
      investments: data
    });
  }

  private normalizeInvestmentType(type: string): string {
    // Normaliza diferentes encodings de "Ações"
    if (type === 'AÃ§Ãµes' || type.includes('Ã§') || type === 'Ações' || type === 'Acoes') {
      return 'Ações';
    }
    if (type === 'Fundos' || type === 'Fundo') {
      return 'Fundos';
    }
    if (type === 'Tesouro' || type === 'Tesouro Direto') {
      return 'Tesouro';
    }
    return type;
  }

  getAllInvestments(): Observable<InvestmentData[]> {
    return of((investmentData as any).investments);
  }
}

