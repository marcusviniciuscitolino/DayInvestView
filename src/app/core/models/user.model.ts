export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'investor';
  password: string;
}

export interface UserSession {
  user: User;
  token: string;
}

