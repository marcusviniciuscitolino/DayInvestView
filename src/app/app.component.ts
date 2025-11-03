import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
    <app-notification></app-notification>
  `,
  styles: []
})
export class AppComponent {
  title = 'DayInvestView';
}

