import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DashboardConfigService } from '../../../core/services/dashboard-config.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DataService } from '../../../core/services/data.service';
import { User } from '../../../core/models/user.model';
import { Theme } from '../../../core/models/theme.model';
import { DashboardConfig, ChartConfig } from '../../../core/models/dashboard-config.model';
import usersData from '../../../../assets/data/users.json';
import { FormControl } from '@angular/forms';
import { Observable, startWith, map } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-client-configuration',
  templateUrl: './client-configuration.component.html',
  styleUrls: ['./client-configuration.component.scss']
})
export class ClientConfigurationComponent implements OnInit {
  investors: User[] = [];
  filteredInvestors$: Observable<User[]> | undefined;
  investorControl = new FormControl<User | string>('');
  themes: Theme[] = [];
  selectedInvestor: User | null = null;
  selectedTheme: Theme | null = null;
  selectedCharts: ChartConfig[] = [];
  availableCharts: ChartConfig[] = [
    { id: '1', type: 'portfolio-quota', title: 'Evolução de Cotas do Portfólio', dataSource: 'quota', position: 1 },
    { id: '2', type: 'interest', title: 'Gráfico de Juros', dataSource: 'movements', position: 2 },
    { id: '3', type: 'ir', title: 'Gráfico de IR', dataSource: 'movements', position: 3 },
    { id: '4', type: 'dividends', title: 'Gráfico de Dividendos', dataSource: 'movements', position: 4 },
    { id: '5', type: 'class-distribution', title: 'Distribuição por Classe', dataSource: 'portfolio', position: 5 },
    { id: '6', type: 'strategy-distribution', title: 'Distribuição por Estratégia', dataSource: 'portfolio', position: 6 }
  ];

  constructor(
    private dashboardConfigService: DashboardConfigService,
    private themeService: ThemeService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadInvestors();
    this.loadThemes();
    this.setupInvestorFilter();
  }

  loadInvestors(): void {
    this.investors = (usersData as any).users.filter((u: User) => u.role === 'investor');
  }

  setupInvestorFilter(): void {
    this.filteredInvestors$ = this.investorControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : value?.name || '';
        return name ? this.filterInvestors(name) : this.investors.slice();
      })
    );
  }

  filterInvestors(name: string): User[] {
    const filterValue = name.toLowerCase();
    return this.investors.filter(investor => 
      investor.name.toLowerCase().includes(filterValue) ||
      investor.email.toLowerCase().includes(filterValue)
    );
  }

  displayInvestor(investor: User | null): string {
    if (!investor || typeof investor === 'string') return '';
    return investor.name || '';
  }

  onInvestorSelected(event: any): void {
    const investor = event.option.value;
    if (investor && typeof investor !== 'string') {
      this.selectInvestor(investor);
    }
  }

  loadThemes(): void {
    this.themeService.getAllThemes().subscribe(themes => {
      this.themes = themes;
      // Se não há tema selecionado e temos temas disponíveis, selecionar o primeiro
      if (!this.selectedTheme && themes.length > 0) {
        this.selectedTheme = themes[0];
        this.cdr.detectChanges();
      }
      // Se já tiver um investidor selecionado, atualizar o tema selecionado
      if (this.selectedInvestor) {
        this.loadInvestorConfig();
      }
    });
  }

  selectInvestor(investor: User): void {
    this.selectedInvestor = investor;
    this.investorControl.setValue(investor, { emitEvent: false });
    this.loadInvestorConfig();
  }

  private loadInvestorConfig(): void {
    if (!this.selectedInvestor) return;
    
    this.dashboardConfigService.getUserConfig(this.selectedInvestor.id).subscribe(config => {
      if (config && this.themes.length > 0) {
        const foundTheme = this.themes.find(t => t.id === config.themeId);
        this.selectedTheme = foundTheme || null;
        
        // Se não encontrou o tema e temos temas disponíveis, usar o primeiro
        if (!foundTheme && this.themes.length > 0) {
          console.warn(`Tema ${config.themeId} não encontrado. Usando primeiro tema disponível.`);
          this.selectedTheme = this.themes[0];
        }
        // Garantir que os gráficos selecionados correspondem aos gráficos disponíveis
        this.selectedCharts = config.chartTypes
          .map(chartConfig => {
            const availableChart = this.availableCharts.find(ac => ac.id === chartConfig.id);
            if (availableChart) {
              return { ...availableChart };
            }
            return null;
          })
          .filter((chart): chart is ChartConfig => chart !== null);
        
        // Força detecção de mudanças após carregar configuração
        this.cdr.detectChanges();
      } else if (config && this.themes.length === 0) {
        // Se temos config mas temas ainda não foram carregados, esperar
        this.themeService.getAllThemes().subscribe(themes => {
          this.themes = themes;
          const foundTheme = themes.find(t => t.id === config.themeId);
          this.selectedTheme = foundTheme || null;
          this.cdr.detectChanges();
        });
      } else {
        // Se não há configuração, definir tema padrão (primeiro da lista)
        if (this.themes.length > 0) {
          this.selectedTheme = this.themes[0];
        } else {
          this.selectedTheme = null;
        }
        this.selectedCharts = [];
        this.cdr.detectChanges();
      }
    });
  }

  toggleChart(chart: ChartConfig): void {
    const index = this.selectedCharts.findIndex(c => c.id === chart.id);
    if (index >= 0) {
      this.selectedCharts.splice(index, 1);
    } else {
      this.selectedCharts.push({ ...chart });
    }
    // Força detecção de mudanças para atualizar a UI
    this.cdr.detectChanges();
  }

  isChartSelected(chartId: string): boolean {
    return this.selectedCharts.some(c => c.id === chartId);
  }

  compareThemes(theme1: Theme | null, theme2: Theme | null): boolean {
    if (!theme1 || !theme2) return theme1 === theme2;
    return theme1.id === theme2.id;
  }

  onThemeChange(theme: Theme): void {
    console.log('Tema alterado para:', theme);
    this.selectedTheme = theme;
    this.cdr.detectChanges();
    console.log('selectedTheme após mudança:', this.selectedTheme);
  }
  
  // Método para verificar se pode salvar (para debug)
  canSave(): boolean {
    return !!this.selectedTheme; // Apenas tema é obrigatório, gráficos são opcionais
  }

  saveConfiguration(): void {
    if (!this.selectedInvestor) {
      this.notificationService.warning('Por favor, selecione um investidor primeiro.');
      return;
    }
    
    if (!this.selectedTheme) {
      this.notificationService.warning('Por favor, selecione um tema.');
      return;
    }
    
    // Permite salvar mesmo sem gráficos selecionados (para ocultar todos os gráficos do cliente)
    const config: DashboardConfig = {
      id: `config-${this.selectedInvestor.id}`,
      userId: this.selectedInvestor.id,
      themeId: this.selectedTheme.id,
      chartTypes: this.selectedCharts, // Pode ser um array vazio
      layout: 'grid'
    };

    console.log('Salvando configuração:', config);
    this.dashboardConfigService.saveConfig(config).subscribe((savedConfig) => {
      console.log('Configuração salva:', savedConfig);
      const chartsMessage = this.selectedCharts.length === 0 
        ? 'Nenhum gráfico exibido' 
        : `${this.selectedCharts.length} gráfico(s)`;
      this.notificationService.success(
        `Configuração salva com sucesso!\nTema: ${this.selectedTheme?.name}\n${chartsMessage}`
      );
    }, (error) => {
      console.error('Erro ao salvar configuração:', error);
      this.notificationService.error('Erro ao salvar configuração. Por favor, tente novamente.');
    });
  }
}

