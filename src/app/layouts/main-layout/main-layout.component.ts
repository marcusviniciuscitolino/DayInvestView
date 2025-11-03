import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; height: 100%; }']
})
export class MainLayoutComponent {
}

