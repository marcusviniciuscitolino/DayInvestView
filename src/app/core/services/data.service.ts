import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { InvestmentData, PortfolioSummary, MovementData, PositionData, PortfolioQuotaData } from '../models/investment-data.model';
import investmentData from '../../../assets/data/investments.json';
import movementsData from '../../../assets/data/movements.json';
import positionsData from '../../../assets/data/positions.json';
import portfolioQuotaData from '../../../assets/data/portfolio-quota.json';

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

  getMovementsByUserId(userId: string): Observable<MovementData[]> {
    const movements: MovementData[] = (movementsData as any).movements.filter(
      (mov: MovementData) => mov.userId === userId
    );
    return of(movements);
  }

  getAllMovements(): Observable<MovementData[]> {
    return of((movementsData as any).movements);
  }

  getPositionsByUserIdAndAsset(userId: string, assetName: string): Observable<PositionData[]> {
    const positions: PositionData[] = (positionsData as any).positions.filter(
      (pos: PositionData) => pos.userId === userId && pos.assetName === assetName
    );
    return of(positions);
  }

  getAllPositions(): Observable<PositionData[]> {
    return of((positionsData as any).positions);
  }

  getPortfolioQuotaByUserId(userId: string): Observable<PortfolioQuotaData[]> {
    const quota: PortfolioQuotaData[] = (portfolioQuotaData as any).portfolioQuota.filter(
      (q: PortfolioQuotaData) => q.userId === userId
    );
    return of(quota);
  }

  getAllPortfolioQuota(): Observable<PortfolioQuotaData[]> {
    return of((portfolioQuotaData as any).portfolioQuota);
  }
}

