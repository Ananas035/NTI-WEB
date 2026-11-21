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
import { OtpChallengeData } from '../../interfaces/interface';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css'
})
export class VerifyOtp implements OnInit, OnDestroy {

  challenge: OtpChallengeData | null = null;

  otp = '';
  errorMessage = '';
  infoMessage = '';

  isVerifying = false;
  isResending = false;

  // Server-enforced cooldown, mirrored in the UI. The backend is the source of
  // truth; this only drives the button state.
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

    this.challenge = this.authService.getPendingChallenge();

    // No pending challenge => nothing to verify. Never allow a stray visit.
    if (!this.challenge) {
      this.router.navigate(['/login']);
      return;
    }

    // Initial cooldown: the code was just sent, so wait the full window.
    this.resendCooldown = this.challenge.resendCooldownSeconds || 0;

    this.startTimer();

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // =========================
  // OTP input handling (digits only, max 6)
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
      this.router.navigate(['/login']);
      return;
    }

    if (!this.isCodeComplete) {
      this.errorMessage = 'otp_error_incomplete';
      this.cdr.detectChanges();
      return;
    }

    this.isVerifying = true;
    this.cdr.detectChanges();

    this.authService.verifyOtp({
      challengeId: this.challenge.challengeId,
      otp: this.otp
    }).subscribe({

      next: (response) => {

        this.isVerifying = false;

        // Success: this is where the authenticated session actually begins.
        this.authService.saveSession(
          response,
          this.challenge?.rememberMe === true
        );

        this.cdr.detectChanges();

        this.router.navigate(['/dashboard']);
      },

      error: (error) => {

        this.isVerifying = false;

        const serverMessage = error.error?.message;

        if (error.status === 400) {
          this.errorMessage = 'otp_error_invalid';
        } else if (error.status === 403) {
          this.errorMessage = 'otp_error_forbidden';
        } else if (error.status === 429) {
          this.errorMessage = 'otp_error_too_many';
        } else if (error.status === 0) {
          this.errorMessage = 'otp_error_connection';
        } else if (error.status >= 500) {
          this.errorMessage = 'otp_error_server';
        } else {
          this.errorMessage = 'otp_error_generic';
        }

        // Surface a server-provided detail when it is safe/generic.
        if (serverMessage && error.status >= 500) {
          this.errorMessage = 'otp_error_server';
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
      this.router.navigate(['/login']);
      return;
    }

    if (this.resendCooldown > 0 || this.isResending) {
      return;
    }

    this.isResending = true;
    this.cdr.detectChanges();

    this.authService.resendOtp({
      challengeId: this.challenge.challengeId
    }).subscribe({

      next: (response) => {

        this.isResending = false;

        // A new code was issued: reset the input, cooldown and expiry window.
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
            ...response.data,
            rememberMe: this.challenge?.rememberMe
          };
          this.authService.setPendingChallenge(this.challenge);
        }

        this.startTimer();
        this.cdr.detectChanges();
      },

      error: (error) => {

        this.isResending = false;

        if (error.status === 429) {
          // Honour the server-provided retry window.
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

  backToLogin(): void {
    this.authService.clearPendingChallenge();
    this.router.navigate(['/login']);
  }

  toggleLanguage(): void {
    this.language.toggleLanguage();
    this.cdr.detectChanges();
  }
}
