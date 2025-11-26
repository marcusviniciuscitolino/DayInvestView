export interface InvestmentData {
  id: string;
  userId: string;
  type: string;
  name: string;
  value: number;
  return: number;
  date: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalReturn: number;
  returnPercentage: number;
  investments: InvestmentData[];
}

export interface MovementData {
  id: string;
  userId: string;
  assetName: string;
  movementType: 'Aplicação' | 'Juros' | 'IR' | 'Vencimento';
  movementDate: string;
  movementValue: number;
  quotaValue: number;
  quantity: number;
}

export interface PositionData {
  id: string;
  userId: string;
  assetName: string;
  date: string;
  quantity: number;
  position: number;
}

