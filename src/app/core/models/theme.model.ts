export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  isCustom: boolean;
  createdBy?: string;
  createdAt?: Date;
}

