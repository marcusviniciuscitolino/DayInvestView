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

