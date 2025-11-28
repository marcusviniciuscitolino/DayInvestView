import { NgModule, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvestorRoutingModule } from './investor-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layouts/layout.module';
import { InvestorDashboardComponent } from './investor-dashboard/investor-dashboard.component';
import { PortfolioChartComponent } from './investor-dashboard/portfolio-chart/portfolio-chart.component';
import { DistributionChartComponent } from './investor-dashboard/distribution-chart/distribution-chart.component';
import { CompositionChartComponent } from './investor-dashboard/composition-chart/composition-chart.component';
import { ReturnsChartComponent } from './investor-dashboard/returns-chart/returns-chart.component';
import { StocksInfoComponent } from './investor-dashboard/stocks-info/stocks-info.component';
import { ManagerModule } from '../manager/manager.module';

@NgModule({
  declarations: [
    InvestorDashboardComponent,
    PortfolioChartComponent,
    DistributionChartComponent,
    CompositionChartComponent,
    ReturnsChartComponent,
    StocksInfoComponent
  ],
  imports: [
    CommonModule,
    InvestorRoutingModule,
    SharedModule,
    LayoutModule,
    forwardRef(() => ManagerModule)
  ],
  exports: [
    PortfolioChartComponent,
    DistributionChartComponent,
    CompositionChartComponent,
    ReturnsChartComponent,
    StocksInfoComponent
  ]
})
export class InvestorModule { }

