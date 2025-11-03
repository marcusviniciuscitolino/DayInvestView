import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Theme } from '../models/theme.model';
import themesData from '../../../assets/data/themes.json';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private customThemes: Theme[] = [];

  getPredefinedThemes(): Observable<Theme[]> {
    return of((themesData as any).themes);
  }

  getAllThemes(): Observable<Theme[]> {
    const allThemes = [...(themesData as any).themes, ...this.customThemes];
    return of(allThemes);
  }

  createTheme(theme: Omit<Theme, 'id' | 'isCustom' | 'createdAt'>): Observable<Theme> {
    const newTheme: Theme = {
      ...theme,
      id: `custom-${Date.now()}`,
      isCustom: true,
      createdAt: new Date()
    };
    this.customThemes.push(newTheme);
    return of(newTheme);
  }

  getThemeById(id: string): Observable<Theme | null> {
    const allThemes = [...(themesData as any).themes, ...this.customThemes];
    const theme = allThemes.find(t => t.id === id);
    return of(theme || null);
  }
}

