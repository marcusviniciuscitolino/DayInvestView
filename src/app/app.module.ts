import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { LayoutModule } from './layouts/layout.module';
import { AuthModule } from './features/auth/auth.module';
import { ManagerModule } from './features/manager/manager.module';
import { InvestorModule } from './features/investor/investor.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    CoreModule,
    SharedModule,
    LayoutModule,
    AuthModule,
    ManagerModule,
    InvestorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

