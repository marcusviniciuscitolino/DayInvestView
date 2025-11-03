import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'];
    const user = this.authService.getCurrentUser();
    
    if (user && user.role === requiredRole) {
      return true;
    }
    
    if (user?.role === 'manager') {
      this.router.navigate(['/manager']);
    } else if (user?.role === 'investor') {
      this.router.navigate(['/investor']);
    } else {
      this.router.navigate(['/auth']);
    }
    
    return false;
  }
}

