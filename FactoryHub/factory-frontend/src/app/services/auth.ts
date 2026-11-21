import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  OtpChallengeData,
  OtpChallengeResponse,
  ResendOtpRequest,
  ResendOtpResponse,
  ResetAuthorizationResponse,
  ResetChallengeData,
  ResetChallengeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SignupRequest,
  User,
  VerifyOtpRequest,
  VerifyResetOtpRequest
} from '../interfaces/interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  // Pending (unverified) OTP challenge. Deliberately kept in sessionStorage
  // and NEVER treated as an authenticated session.
  private readonly pendingKey = 'pending_otp_challenge';

  // Password-recovery state. The pending reset challenge holds only a
  // challengeId (never an OTP). The reset authorization holds the short-lived
  // single-use reset token. Both live in sessionStorage and are cleared when the
  // workflow completes, is cancelled, or the browser session ends.
  private readonly pendingResetKey = 'pending_reset_challenge';
  private readonly resetAuthKey = 'reset_authorization';

  constructor(private api: ApiService) {}

  // =========================
  // Registration initiation
  // =========================

  // Returns an OTP challenge — NOT a token. The account is created unverified.
  signup(payload: SignupRequest): Observable<OtpChallengeResponse> {
    return this.api.post<OtpChallengeResponse>(
      '/auth/signup',
      payload
    );
  }

  // =========================
  // Login initiation
  // =========================

  // Verifies credentials and returns an OTP challenge — NOT a token.
  login(credentials: LoginRequest): Observable<OtpChallengeResponse> {
    return this.api.post<OtpChallengeResponse>(
      '/auth/login',
      credentials
    );
  }

  // =========================
  // OTP verification / resend
  // =========================

  // Only a successful verification returns the authenticated payload (token).
  verifyOtp(payload: VerifyOtpRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(
      '/auth/verify-email-otp',
      payload
    );
  }

  resendOtp(payload: ResendOtpRequest): Observable<ResendOtpResponse> {
    return this.api.post<ResendOtpResponse>(
      '/auth/resend-email-otp',
      payload
    );
  }

  // =========================
  // Pending challenge storage
  // =========================

  setPendingChallenge(challenge: OtpChallengeData): void {
    sessionStorage.setItem(
      this.pendingKey,
      JSON.stringify(challenge)
    );
  }

  getPendingChallenge(): OtpChallengeData | null {

    const raw = sessionStorage.getItem(this.pendingKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as OtpChallengeData;
    } catch {
      return null;
    }
  }

  clearPendingChallenge(): void {
    sessionStorage.removeItem(this.pendingKey);
  }

  // =========================
  // Password recovery
  // =========================

  // Stage 1: identify the account and trigger a reset OTP. The response is a
  // deliberately generic challenge (it never contains the account's email).
  forgotPassword(
    payload: ForgotPasswordRequest
  ): Observable<ResetChallengeResponse> {
    return this.api.post<ResetChallengeResponse>(
      '/auth/forgot-password',
      payload
    );
  }

  // Stage 2: verify the reset OTP. Returns a single-use reset authorization,
  // NOT a login session.
  verifyResetOtp(
    payload: VerifyResetOtpRequest
  ): Observable<ResetAuthorizationResponse> {
    return this.api.post<ResetAuthorizationResponse>(
      '/auth/verify-reset-otp',
      payload
    );
  }

  resendResetOtp(
    payload: ResendOtpRequest
  ): Observable<ResetChallengeResponse> {
    return this.api.post<ResetChallengeResponse>(
      '/auth/resend-reset-otp',
      payload
    );
  }

  // Stage 3: complete the reset using the reset authorization.
  resetPassword(
    payload: ResetPasswordRequest
  ): Observable<ResetPasswordResponse> {
    return this.api.post<ResetPasswordResponse>(
      '/auth/reset-password',
      payload
    );
  }

  // ---- pending reset challenge (challengeId only, never an OTP) ----

  setPendingResetChallenge(challenge: ResetChallengeData): void {
    sessionStorage.setItem(
      this.pendingResetKey,
      JSON.stringify(challenge)
    );
  }

  getPendingResetChallenge(): ResetChallengeData | null {
    const raw = sessionStorage.getItem(this.pendingResetKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ResetChallengeData;
    } catch {
      return null;
    }
  }

  clearPendingResetChallenge(): void {
    sessionStorage.removeItem(this.pendingResetKey);
  }

  // ---- reset authorization (short-lived, single-use) ----

  setResetAuthorization(resetToken: string, expiresAt: string): void {
    sessionStorage.setItem(
      this.resetAuthKey,
      JSON.stringify({ resetToken, expiresAt })
    );
  }

  getResetAuthorization(): { resetToken: string; expiresAt: string } | null {
    const raw = sessionStorage.getItem(this.resetAuthKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as { resetToken: string; expiresAt: string };
    } catch {
      return null;
    }
  }

  clearResetAuthorization(): void {
    sessionStorage.removeItem(this.resetAuthKey);
  }

  // Clear every piece of password-recovery state (on completion or cancel).
  clearPasswordRecovery(): void {
    this.clearPendingResetChallenge();
    this.clearResetAuthorization();
  }

  // =========================
  // Session management
  // =========================

  saveSession(
    response: LoginResponse,
    rememberMe: boolean
  ): void {

    const token = response.data.token;
    const user = response.data.user;

    // Clear old session first
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);

    const storage = rememberMe
      ? localStorage
      : sessionStorage;

    storage.setItem(
      this.tokenKey,
      token
    );

    storage.setItem(
      this.userKey,
      JSON.stringify(user)
    );

    // A completed session means the OTP challenge is finished.
    this.clearPendingChallenge();
  }

  /**
   * Get token from localStorage or sessionStorage
   */
  getToken(): string | null {

    return (
      localStorage.getItem(this.tokenKey) ||
      sessionStorage.getItem(this.tokenKey)
    );
  }

  /**
   * Get logged-in user
   */
  getUser(): User | null {

    const user =
      localStorage.getItem(this.userKey) ||
      sessionStorage.getItem(this.userKey);

    if (!user) {
      return null;
    }

    try {

      return JSON.parse(user) as User;

    } catch {

      return null;

    }
  }

  /**
   * Check if token exists
   */
  isLoggedIn(): boolean {

  const token = this.getToken();

  if (!token) {
    return false;
  }

  if (this.isTokenExpired()) {

    this.logout();

    return false;
  }

  return true;
}

  /**
   * Logout
   */
  logout(): void {

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);

    this.clearPendingChallenge();
  }

  isTokenExpired(): boolean {

  const token = this.getToken();

  if (!token) {
    return true;
  }

  try {

    const payload = JSON.parse(
      atob(token.split('.')[1])
    );

    const expiration = payload.exp * 1000;

    return Date.now() >= expiration;

  } catch {

    // If token is invalid
    return true;
  }
}
}
