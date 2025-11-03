import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from './material.module';
import { NgChartsModule } from 'ng2-charts';
import { NotificationComponent } from './components/notification/notification.component';

@NgModule({
  declarations: [
    NotificationComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NgChartsModule
  ],
  exports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    NgChartsModule,
    NotificationComponent
  ]
})
export class SharedModule { }

