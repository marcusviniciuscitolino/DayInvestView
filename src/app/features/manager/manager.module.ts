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
import { InvestorModule } from '../investor/investor.module';

@NgModule({
  declarations: [
    ManagerDashboardComponent,
    ThemeManagementComponent,
    ClientConfigurationComponent,
    CreateThemeDialogComponent,
    ViewClientDashboardComponent
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

