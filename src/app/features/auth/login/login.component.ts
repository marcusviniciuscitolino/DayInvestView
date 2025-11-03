import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      const { email, password } = this.loginForm.value;
      
      this.authService.login(email, password).subscribe({
        next: (session) => {
          if (session) {
            const route = session.user.role === 'manager' ? '/manager' : '/investor';
            this.router.navigate([route]);
          } else {
            this.snackBar.open('Email ou senha inválidos', 'Fechar', {
              duration: 3000
            });
            this.loading = false;
          }
        },
        error: () => {
          this.snackBar.open('Erro ao fazer login', 'Fechar', {
            duration: 3000
          });
          this.loading = false;
        }
      });
    }
  }
}

