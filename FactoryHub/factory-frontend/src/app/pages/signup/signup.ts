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
    private authService: AuthService,
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
    // Send to Backend — starts email verification (no token yet)
    // =========================

    this.authService.signup({
      name: this.username.trim(),
      email: this.email.trim(),
      password: this.password,
      phone: this.mobile.trim()
    }).subscribe({

      // =========================
      // Signup Success -> go verify the emailed OTP
      // =========================

      next: (response) => {

        this.isLoading = false;

        // Stash the pending challenge (never a session) and continue.
        this.authService.setPendingChallenge({
          ...response.data,
          rememberMe: false
        });

        this.cdr.detectChanges();

        this.router.navigate(['/verify-otp']);
      },

      // =========================
      // Signup Error
      // =========================

      error: (error) => {

        this.isLoading = false;

        if (error.status === 409) {

          this.errorMessage =
            'signup_error_email_exists';

        } else if (error.status === 400) {

          this.errorMessage =
            error.error?.message ||
            'signup_error_invalid_data';

        } else if (error.status === 502) {

          this.errorMessage =
            'signup_error_email_send';

        } else if (error.status === 429) {

          this.errorMessage =
            'signup_error_too_many';

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
