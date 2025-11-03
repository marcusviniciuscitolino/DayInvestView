import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSidenav } from '@angular/material/sidenav';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-manager-layout',
  templateUrl: './manager-layout.component.html',
  styleUrls: ['./manager-layout.component.scss']
})
export class ManagerLayoutComponent implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';

    // Ajusta o sidenav baseado no tamanho da tela
    setTimeout(() => {
      if (this.sidenav) {
        if (window.innerWidth < 960) {
          this.sidenav.close();
        } else {
          this.sidenav.open();
        }
      }
    });

    // Fecha o sidenav quando navegar em telas pequenas
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.sidenav && window.innerWidth < 960) {
          this.sidenav.close();
        }
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}

