import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvestorLayoutComponent } from '../../layouts/investor-layout/investor-layout.component';
import { InvestorDashboardComponent } from './investor-dashboard/investor-dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: InvestorLayoutComponent,
    children: [
      {
        path: '',
        component: InvestorDashboardComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InvestorRoutingModule { }

