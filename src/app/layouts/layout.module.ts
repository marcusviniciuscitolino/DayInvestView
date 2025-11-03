import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { ManagerLayoutComponent } from './manager-layout/manager-layout.component';
import { InvestorLayoutComponent } from './investor-layout/investor-layout.component';

@NgModule({
  declarations: [
    MainLayoutComponent,
    ManagerLayoutComponent,
    InvestorLayoutComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    MainLayoutComponent,
    ManagerLayoutComponent,
    InvestorLayoutComponent
  ]
})
export class LayoutModule { }

