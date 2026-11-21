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
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {

  // Registered username (name) or email address.
  identifier = '';
  phone = '';

  errorMessage = '';
  infoMessage = '';
  isLoading = false;

  identifierTouched = false;
  phoneTouched = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public language: Language
  ) {}

  onIdentifierInput(value: string): void {
    this.identifier = String(value || '').trimStart();
    this.errorMessage = '';
  }

  onPhoneInput(value: string): void {
    // Allow digits and common separators only.
    this.phone = String(value || '').replace(/[^\d+\s()-]/g, '');
    this.errorMessage = '';
  }

  onSubmit(): void {

    this.identifierTouched = true;
    this.phoneTouched = true;

    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.identifier.trim() || !this.phone.trim()) {
      this.errorMessage = 'forgot_error_required';
      this.cdr.detectChanges();
      return;
    }

    const phoneDigits = this.phone.replace(/\D/g, '');

    if (phoneDigits.length < 6) {
      this.errorMessage = 'forgot_error_invalid_phone';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.forgotPassword({
      identifier: this.identifier.trim(),
      phone: this.phone.trim()
    }).subscribe({

      next: (response) => {

        this.isLoading = false;

        // Store only the challenge reference (never an OTP) and continue to
        // stage two. The backend response is intentionally generic.
        this.authService.setPendingResetChallenge(response.data);

        this.cdr.detectChanges();

        this.router.navigate(['/verify-reset-otp']);
      },

      error: (error) => {

        this.isLoading = false;

        if (error.status === 429) {
          this.errorMessage = 'forgot_error_too_many';
        } else if (error.status === 502) {
          this.errorMessage = 'forgot_error_email_send';
        } else if (error.status === 0) {
          this.errorMessage = 'forgot_error_connection';
        } else if (error.status >= 500) {
          this.errorMessage = 'forgot_error_server';
        } else {
          this.errorMessage = 'forgot_error_generic';
        }

        this.cdr.detectChanges();
      }

    });
  }

  backToLogin(): void {
    this.authService.clearPasswordRecovery();
    this.router.navigate(['/login']);
  }

  toggleLanguage(): void {
    this.language.toggleLanguage();
    this.cdr.detectChanges();
  }
}
