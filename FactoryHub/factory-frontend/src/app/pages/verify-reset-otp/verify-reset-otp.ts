import {
  Component,
  ChangeDetectorRef,
  OnDestroy,
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
import { ResetChallengeData } from '../../interfaces/interface';

// Dedicated password-reset OTP page. It is intentionally separate from the
// login/registration VerifyOtp component so the two flows never share state:
// a successful code here only yields a single-use reset authorization, never a
// login session.
@Component({
  selector: 'app-verify-reset-otp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './verify-reset-otp.html',
  styleUrl: './verify-reset-otp.css'
})
export class VerifyResetOtp implements OnInit, OnDestroy {

  challenge: ResetChallengeData | null = null;

  otp = '';
  errorMessage = '';
  infoMessage = '';

  isVerifying = false;
  isResending = false;

  // Server-enforced cooldown, mirrored in the UI only.
  resendCooldown = 0;

  // Seconds remaining until the code expires (display only).
  expiresInSeconds = 0;

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    public language: Language
  ) {}

  ngOnInit(): void {

    this.challenge = this.authService.getPendingResetChallenge();

    // No pending reset challenge => nothing to verify.
    if (!this.challenge) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    this.resendCooldown = this.challenge.resendCooldownSeconds || 0;

    this.startTimer();

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // =========================
  // OTP input (digits only, exactly 6)
  // =========================

  onOtpInput(value: string): void {

    this.otp = String(value || '')
      .replace(/\D/g, '')
      .slice(0, 6);

    this.errorMessage = '';
  }

  get isCodeComplete(): boolean {
    return /^\d{6}$/.test(this.otp);
  }

  // =========================
  // Verify
  // =========================

  onVerify(): void {

    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.challenge) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    if (!this.isCodeComplete) {
      this.errorMessage = 'otp_error_incomplete';
      this.cdr.detectChanges();
      return;
    }

    this.isVerifying = true;
    this.cdr.detectChanges();

    this.authService.verifyResetOtp({
      challengeId: this.challenge.challengeId,
      otp: this.otp
    }).subscribe({

      next: (response) => {

        this.isVerifying = false;

        this.otp = '';

        // The reset challenge is spent; store only the single-use reset
        // authorization (never the OTP) and continue to stage three. This is
        // NOT a login — no session is created here.
        this.authService.clearPendingResetChallenge();
        this.authService.setResetAuthorization(
          response.data.resetToken,
          response.data.expiresAt
        );

        this.cdr.detectChanges();

        this.router.navigate(['/reset-password']);
      },

      error: (error) => {

        this.isVerifying = false;

        if (error.status === 400) {
          this.errorMessage = 'otp_error_invalid';
        } else if (error.status === 429) {
          this.errorMessage = 'otp_error_too_many';
        } else if (error.status === 0) {
          this.errorMessage = 'otp_error_connection';
        } else if (error.status >= 500) {
          this.errorMessage = 'otp_error_server';
        } else {
          this.errorMessage = 'otp_error_generic';
        }

        this.cdr.detectChanges();
      }

    });
  }

  // =========================
  // Resend
  // =========================

  onResend(): void {

    this.errorMessage = '';
    this.infoMessage = '';

    if (!this.challenge) {
      this.router.navigate(['/forgot-password']);
      return;
    }

    if (this.resendCooldown > 0 || this.isResending) {
      return;
    }

    this.isResending = true;
    this.cdr.detectChanges();

    this.authService.resendResetOtp({
      challengeId: this.challenge.challengeId
    }).subscribe({

      next: (response) => {

        this.isResending = false;

        this.otp = '';
        this.infoMessage = 'otp_resend_success';

        const seconds =
          response.data?.resendCooldownSeconds ??
          this.challenge?.resendCooldownSeconds ??
          60;

        this.resendCooldown = seconds;

        if (response.data) {
          this.challenge = {
            ...this.challenge!,
            ...response.data
          };
          this.authService.setPendingResetChallenge(this.challenge);
        }

        this.startTimer();
        this.cdr.detectChanges();
      },

      error: (error) => {

        this.isResending = false;

        if (error.status === 429) {
          const retry = error.error?.retryAfterSeconds;
          this.resendCooldown =
            typeof retry === 'number' && retry > 0 ? retry : 60;
          this.errorMessage = 'otp_error_resend_cooldown';
          this.startTimer();
        } else if (error.status === 0) {
          this.errorMessage = 'otp_error_connection';
        } else if (error.status >= 500) {
          this.errorMessage = 'otp_error_server';
        } else {
          this.errorMessage = 'otp_error_generic';
        }

        this.cdr.detectChanges();
      }

    });
  }

  // =========================
  // Timers
  // =========================

  private startTimer(): void {

    this.stopTimer();

    this.updateCountdowns();

    this.timer = setInterval(() => {
      this.updateCountdowns();
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer(): void {

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateCountdowns(): void {

    if (this.resendCooldown > 0) {
      this.resendCooldown -= 1;
    }

    if (this.challenge?.expiresAt) {
      const diff = Math.floor(
        (new Date(this.challenge.expiresAt).getTime() - Date.now()) / 1000
      );
      this.expiresInSeconds = diff > 0 ? diff : 0;
    }
  }

  // =========================
  // Navigation / language
  // =========================

  backToForgot(): void {
    this.authService.clearPasswordRecovery();
    this.router.navigate(['/forgot-password']);
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
