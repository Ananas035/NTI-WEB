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

import { ApiService } from '../../services/api';
import { Language } from '../../services/language';
import { TranslatePipe } from '../../pipes/translate-pipe';

interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      role: string;
    };
    token: string;
  };
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {

  username = '';
  email = '';
  mobile = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';

  showPassword = false;
  isLoading = false;

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public language: Language
  ) {}

  onSignup(): void {

    // Clear old messages
    this.errorMessage = '';
    this.successMessage = '';

    // =========================
    // Validation
    // =========================

    if (
      !this.username.trim() ||
      !this.email.trim() ||
      !this.mobile.trim() ||
      !this.password.trim() ||
      !this.confirmPassword.trim()
    ) {

      this.errorMessage =
        'signup_error_required_fields';

      this.cdr.detectChanges();

      return;
    }

    if (this.password.length < 6) {

      this.errorMessage =
        'signup_error_password_length';

      this.cdr.detectChanges();

      return;
    }

    if (
      this.password !==
      this.confirmPassword
    ) {

      this.errorMessage =
        'signup_error_password_match';

      this.cdr.detectChanges();

      return;
    }

    // =========================
    // Email validation
    // =========================

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        this.email.trim()
      )
    ) {

      this.errorMessage =
        'signup_error_invalid_email';

      this.cdr.detectChanges();

      return;
    }

    // =========================
    // Start loading
    // =========================

    this.isLoading = true;

    this.cdr.detectChanges();

    // =========================
    // Send to Backend
    // =========================

    this.api.post<SignupResponse>(
      '/auth/signup',
      {
        name: this.username.trim(),
        email: this.email.trim(),
        password: this.password,
        phone: this.mobile.trim()
      }
    ).subscribe({

      // =========================
      // Signup Success
      // =========================

      next: (response) => {

        this.isLoading = false;

        this.successMessage =
          response.message ||
          this.language.translate(
            'signup_success'
          );

        this.cdr.detectChanges();

        // Go to login after successful registration
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },

      // =========================
      // Signup Error
      // =========================

      error: (error) => {

        console.log(
          'SIGNUP ERROR:',
          error
        );

        this.isLoading = false;

        if (error.status === 409) {

          this.errorMessage =
            'signup_error_email_exists';

        } else if (error.status === 400) {

          this.errorMessage =
            error.error?.message ||
            'signup_error_invalid_data';

        } else if (error.status === 0) {

          this.errorMessage =
            'signup_error_server_connection';

        } else if (error.status >= 500) {

          this.errorMessage =
            'signup_error_server';

        } else {

          this.errorMessage =
            error.error?.message ||
            'signup_error_generic';
        }

        this.cdr.detectChanges();
      }

    });
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