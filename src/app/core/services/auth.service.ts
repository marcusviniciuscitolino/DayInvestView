import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { User, UserSession } from '../models/user.model';
import usersData from '../../../assets/data/users.json';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentSession: UserSession | null = null;

  login(email: string, password: string): Observable<UserSession | null> {
    const users: User[] = (usersData as any).users;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const session: UserSession = {
        user: { ...user, password: '' },
        token: `mock-token-${user.id}-${Date.now()}`
      };
      this.currentSession = session;
      localStorage.setItem('session', JSON.stringify(session));
      return of(session);
    }
    
    return of(null);
  }

  logout(): void {
    this.currentSession = null;
    localStorage.removeItem('session');
  }

  getCurrentSession(): UserSession | null {
    if (!this.currentSession) {
      const stored = localStorage.getItem('session');
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    }
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  }

  getCurrentUser(): User | null {
    return this.getCurrentSession()?.user || null;
  }
}
