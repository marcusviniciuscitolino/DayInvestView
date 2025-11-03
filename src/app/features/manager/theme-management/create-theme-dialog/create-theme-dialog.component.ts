import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ThemeService } from '../../../../core/services/theme.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-theme-dialog',
  templateUrl: './create-theme-dialog.component.html',
  styleUrls: ['./create-theme-dialog.component.scss']
})
export class CreateThemeDialogComponent {
  themeForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateThemeDialogComponent>,
    private themeService: ThemeService,
    private snackBar: MatSnackBar
  ) {
    this.themeForm = this.fb.group({
      name: ['', Validators.required],
      primaryColor: ['#1A3B7A', Validators.required],
      accentColor: ['#4CAF50', Validators.required],
      backgroundColor: ['#FFFFFF', Validators.required],
      textColor: ['#000000', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.themeForm.valid) {
      this.themeService.createTheme(this.themeForm.value).subscribe({
        next: () => {
          this.snackBar.open('Tema criado com sucesso!', 'Fechar', {
            duration: 3000
          });
          this.dialogRef.close(true);
        },
        error: () => {
          this.snackBar.open('Erro ao criar tema', 'Fechar', {
            duration: 3000
          });
        }
      });
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}

