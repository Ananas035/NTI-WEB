import {
  Component,
  ChangeDetectorRef,
  OnInit
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

// Stage three: set the new password. Reachable only with a valid reset
// authorization obtained from a successful reset-OTP verification. The browser
// guard is a convenience only; the backend independently validates the token.
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css'
})
export class ResetPassword implements OnInit {

  newPassword = '';
  confirmPassword = '';

  showNewPassword = false;
  showConfirmPassword = false;

  errorMessage = '';
  isLoading = false;
  isSuccess = false;

  newTouched = false;
  confirmTouched = false;

  private resetToken: string | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public language: Language
  ) {}

  ngOnInit(): void {

    const authorization = this.authService.getResetAuthorization();

    if (!authorization || !authorization.resetToken) {
      // Direct navigation without verification is not allowed.
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.resetToken = authorization.resetToken;

    // Optional client-side hint only; the server enforces the real expiry.
    if (
      authorization.expiresAt &&
      new Date(authorization.expiresAt).getTime() <= Date.now()
    ) {
      this.authService.clearPasswordRecovery();
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.cdr.detectChanges();
  }

  // =========================
  // Field helpers
  // =========================

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  get isFormValid(): boolean {
    return (
      this.newPassword.length >= 6 &&
      this.confirmPassword.length >= 6 &&
      this.passwordsMatch
    );
  }

  toggleNewPassword(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // =========================
  // Submit
  // =========================

  onSubmit(): void {

    this.newTouched = true;
    this.confirmTouched = true;
    this.errorMessage = '';

    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'reset_pw_error_required';
      this.cdr.detectChanges();
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'reset_pw_error_policy';
      this.cdr.detectChanges();
      return;
    }

    if (!this.passwordsMatch) {
      this.errorMessage = 'reset_pw_error_mismatch';
      this.cdr.detectChanges();
      return;
    }

    if (!this.resetToken) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    this.authService.resetPassword({
      resetToken: this.resetToken,
      password: this.newPassword
    }).subscribe({

      next: () => {

        this.isLoading = false;
        this.isSuccess = true;

        // The recovery session is finished: drop every piece of local state.
        this.newPassword = '';
        this.confirmPassword = '';
        this.authService.clearPasswordRecovery();

        this.cdr.detectChanges();
      },

      error: (error) => {

        this.isLoading = false;

        if (error.status === 429) {
          this.errorMessage = 'reset_pw_error_too_many';
        } else if (error.status === 400) {
          // Invalid/expired/consumed authorization: restart the flow.
          this.errorMessage = 'reset_pw_error_invalid';
          this.authService.clearPasswordRecovery();
        } else if (error.status === 0) {
          this.errorMessage = 'reset_pw_error_connection';
        } else if (error.status >= 500) {
          this.errorMessage = 'reset_pw_error_server';
        } else {
          this.errorMessage = 'reset_pw_error_generic';
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
