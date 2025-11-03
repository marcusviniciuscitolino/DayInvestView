import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DashboardConfig } from '../models/dashboard-config.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardConfigService {
  private configs: DashboardConfig[] = [];

  constructor() {
    // Carregar configurações do localStorage na inicialização
    this.loadConfigsFromStorage();
  }

  private loadConfigsFromStorage(): void {
    // Carregar todas as configurações salvas no localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dashboard-config-')) {
        try {
          const config = JSON.parse(localStorage.getItem(key) || '{}');
          if (config && config.userId) {
            const existingIndex = this.configs.findIndex(c => c.userId === config.userId);
            if (existingIndex >= 0) {
              this.configs[existingIndex] = config;
            } else {
              this.configs.push(config);
            }
          }
        } catch (e) {
          console.error('Erro ao carregar configuração do localStorage:', e);
        }
      }
    }
  }

  getUserConfig(userId: string): Observable<DashboardConfig | null> {
    // Primeiro verifica na memória
    let config = this.configs.find(c => c.userId === userId);
    
    // Se não encontrar, tenta carregar do localStorage
    if (!config) {
      try {
        const storedConfig = localStorage.getItem(`dashboard-config-${userId}`);
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig) as DashboardConfig;
          // Verifica se a configuração é válida antes de adicionar
          if (parsedConfig && parsedConfig.userId) {
            config = parsedConfig;
            // Adiciona à lista de configurações em memória
            this.configs.push(config);
          }
        }
      } catch (e) {
        console.error('Erro ao carregar configuração do localStorage:', e);
      }
    }
    
    return of(config || null);
  }

  saveConfig(config: DashboardConfig): Observable<DashboardConfig> {
    const existingIndex = this.configs.findIndex(c => c.userId === config.userId);
    if (existingIndex >= 0) {
      this.configs[existingIndex] = config;
    } else {
      this.configs.push(config);
    }
    localStorage.setItem(`dashboard-config-${config.userId}`, JSON.stringify(config));
    return of(config);
  }

  deleteConfig(userId: string): Observable<void> {
    this.configs = this.configs.filter(c => c.userId !== userId);
    localStorage.removeItem(`dashboard-config-${userId}`);
    return of(void 0);
  }
}

