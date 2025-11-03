import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManagerLayoutComponent } from '../../layouts/manager-layout/manager-layout.component';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard.component';
import { ThemeManagementComponent } from './theme-management/theme-management.component';
import { ClientConfigurationComponent } from './client-configuration/client-configuration.component';
import { ViewClientDashboardComponent } from './view-client-dashboard/view-client-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      {
        path: '',
        component: ManagerDashboardComponent
      },
      {
        path: 'themes',
        component: ThemeManagementComponent
      },
      {
        path: 'clients',
        component: ClientConfigurationComponent
      },
      {
        path: 'view-client',
        component: ViewClientDashboardComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }

