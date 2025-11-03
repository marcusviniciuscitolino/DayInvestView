# Arquitetura DayInvestView

## Visão Geral

Aplicação Angular modular construída como protótipo, seguindo princípios de Clean Architecture e separação de responsabilidades.

## Estrutura de Módulos

```
src/app/
├── core/                    # Serviços singleton, modelos e guards
│   ├── models/              # Interfaces e tipos TypeScript
│   ├── services/            # Serviços compartilhados (Auth, Data, Theme, Config)
│   └── guards/              # Route guards (AuthGuard, RoleGuard)
│
├── shared/                  # Componentes e módulos reutilizáveis
│   ├── material.module.ts   # Módulo do Angular Material
│   └── shared.module.ts     # Módulo compartilhado
│
├── layouts/                 # Layouts da aplicação
│   ├── main-layout/         # Layout base
│   ├── manager-layout/      # Layout do gerente
│   └── investor-layout/      # Layout do investidor
│
└── features/                # Módulos de funcionalidades (lazy loading)
    ├── auth/                # Autenticação mockada
    ├── manager/             # Funcionalidades do gerente
    │   ├── manager-dashboard/
    │   ├── theme-management/
    │   └── client-configuration/
    └── investor/            # Dashboard do investidor
        └── investor-dashboard/
            ├── portfolio-chart/
            ├── distribution-chart/
            ├── composition-chart/
            └── returns-chart/
```

## Fluxo de Dados

### Autenticação
1. Login mockado com dados do `users.json`
2. Sessão armazenada no `localStorage`
3. Guards protegem rotas baseadas em role

### Dashboard do Gerente
1. **Gerenciar Temas**: Criar temas personalizados (cores, estilos)
2. **Configurar Clientes**: Associar temas e gráficos a investidores

### Dashboard do Investidor
1. Carrega configuração do usuário (tema + gráficos)
2. Aplica tema personalizado dinamicamente
3. Renderiza apenas gráficos configurados pelo gerente

## Padrões Utilizados

- **Feature Modules**: Cada funcionalidade é um módulo independente
- **Lazy Loading**: Módulos carregados sob demanda
- **Component-based**: Componentes pequenos e focados
- **Service Layer**: Lógica de negócio nos serviços
- **Guards**: Proteção de rotas baseada em autenticação e roles

## Tecnologias

- Angular 17
- Angular Material
- Chart.js / ng2-charts
- RxJS
- TypeScript

## Dados Mockados

- `/assets/data/users.json` - 10 usuários (1 gerente + 9 investidores)
- `/assets/data/investments.json` - Dados de investimentos
- `/assets/data/themes.json` - Temas pré-definidos

