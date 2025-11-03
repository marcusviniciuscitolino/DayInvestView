import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { Theme } from '../../../core/models/theme.model';
import { MatDialog } from '@angular/material/dialog';
import { CreateThemeDialogComponent } from './create-theme-dialog/create-theme-dialog.component';

@Component({
  selector: 'app-theme-management',
  templateUrl: './theme-management.component.html',
  styleUrls: ['./theme-management.component.scss']
})
export class ThemeManagementComponent implements OnInit {
  themes: Theme[] = [];

  constructor(
    private themeService: ThemeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadThemes();
  }

  loadThemes(): void {
    this.themeService.getAllThemes().subscribe(themes => {
      this.themes = themes;
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateThemeDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadThemes();
      }
    });
  }
}

