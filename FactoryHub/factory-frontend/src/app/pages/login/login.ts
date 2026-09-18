import {
  Component,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterModule
} from '@angular/router';

import { AuthService } from '../../services/auth';
import { Language } from '../../services/language';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';
  rememberMe = false;
  errorMessage = '';

  showPassword = false;
  isLoading = false;

  // Validation
  emailTouched = false;
  passwordTouched = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public language: Language
  ) {}

  onLogin(): void {

    // Show required messages when pressing Login
    this.emailTouched = true;
    this.passwordTouched = true;

    // Clear previous server error
    this.errorMessage = '';

    // Check empty fields
    if (
      !this.email.trim() ||
      !this.password.trim()
    ) {
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;

    // Update button immediately
    this.cdr.detectChanges();

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).subscribe({

      // =========================
      // Login Success
      // =========================
      next: (response) => {

        this.isLoading = false;

        this.authService.saveSession(
          response,
          this.rememberMe
        );

        this.cdr.detectChanges();

        this.router.navigate(['/dashboard']);
      },

      // =========================
      // Login Error
      // =========================
      error: (error) => {

        console.log(
          'LOGIN ERROR RECEIVED:',
          error
        );

        this.isLoading = false;

        if (error.status === 401) {

          this.errorMessage =
            'login_error_invalid_credentials';

        }
        else if (error.status === 0) {

          this.errorMessage =
            'login_error_server_connection';

        }
        else if (error.status === 404) {

          this.errorMessage =
            'login_error_route_not_found';

        }
        else if (error.status >= 500) {

          this.errorMessage =
            'login_error_server';

        }
        else {

          this.errorMessage =
            'login_error_generic';

        }

        // Force Angular to update the UI immediately
        this.cdr.detectChanges();
      }

    });
  }

  onEmailBlur(): void {

    this.emailTouched = true;

    this.cdr.detectChanges();
  }

  onPasswordBlur(): void {

    this.passwordTouched = true;

    this.cdr.detectChanges();
  }

  togglePassword(): void {

    this.showPassword =
      !this.showPassword;
  }

  toggleLanguage(): void {

    this.language.toggleLanguage();

    this.cdr.detectChanges();
  }
}