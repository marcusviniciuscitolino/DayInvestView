import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManagerRoutingModule } from './manager-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { LayoutModule } from '../../layouts/layout.module';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { ThemeManagementComponent } from './theme-management/theme-management.component';
import { ClientConfigurationComponent } from './client-configuration/client-configuration.component';
import { CreateThemeDialogComponent } from './theme-management/create-theme-dialog/create-theme-dialog.component';
import { ViewClientDashboardComponent } from './view-client-dashboard/view-client-dashboard.component';
import { ClientInvestmentsComponent } from './client-investments/client-investments.component';
import { InterestChartComponent } from './client-investments/interest-chart/interest-chart.component';
import { InterestValuesDialogComponent } from './client-investments/interest-chart/interest-values-dialog/interest-values-dialog.component';
import { IrChartComponent } from './client-investments/ir-chart/ir-chart.component';
import { IrValuesDialogComponent } from './client-investments/ir-chart/ir-values-dialog/ir-values-dialog.component';
import { PositionDailyComponent } from './position-daily/position-daily.component';
import { InvestorModule } from '../investor/investor.module';

@NgModule({
  declarations: [
    ManagerDashboardComponent,
    ThemeManagementComponent,
    ClientConfigurationComponent,
    CreateThemeDialogComponent,
    ViewClientDashboardComponent,
    ClientInvestmentsComponent,
    InterestChartComponent,
    InterestValuesDialogComponent,
    IrChartComponent,
    IrValuesDialogComponent,
    PositionDailyComponent
  ],
  imports: [
    CommonModule,
    ManagerRoutingModule,
    SharedModule,
    LayoutModule,
    InvestorModule
  ]
})
export class ManagerModule { }

