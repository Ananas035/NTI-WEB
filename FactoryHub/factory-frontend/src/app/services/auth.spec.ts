import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { AuthService } from './auth';
import { LoginResponse } from '../interfaces/interface';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const baseUrl = 'http://localhost:5000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('signup posts to /auth/signup', () => {
    service.signup({
      name: 'A',
      email: 'a@b.com',
      password: 'secret1'
    }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/signup`);
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      message: 'ok',
      data: {
        requiresVerification: true,
        purpose: 'REGISTRATION',
        challengeId: 'abc',
        email: 'a@b.com',
        expiresAt: new Date().toISOString(),
        resendCooldownSeconds: 60
      }
    });
  });

  it('login posts to /auth/login', () => {
    service.login({ email: 'a@b.com', password: 'secret1' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('verifyOtp posts to /auth/verify-email-otp', () => {
    service.verifyOtp({ challengeId: 'abc', otp: '123456' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/verify-email-otp`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('resendOtp posts to /auth/resend-email-otp', () => {
    service.resendOtp({ challengeId: 'abc' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/resend-email-otp`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('stores and clears the pending challenge without a token', () => {
    service.setPendingChallenge({
      requiresVerification: true,
      purpose: 'LOGIN',
      challengeId: 'abc',
      email: 'a@b.com',
      expiresAt: new Date().toISOString(),
      resendCooldownSeconds: 60
    });

    expect(service.getPendingChallenge()?.challengeId).toBe('abc');
    expect(service.getToken()).toBeNull();

    service.clearPendingChallenge();
    expect(service.getPendingChallenge()).toBeNull();
  });

  it('saveSession stores the token and clears the pending challenge', () => {
    const response: LoginResponse = {
      success: true,
      message: 'ok',
      data: {
        user: { id: '1', name: 'A', email: 'a@b.com', role: 'ADMIN' },
        token: 'header.payload.sig'
      }
    };

    service.setPendingChallenge({
      requiresVerification: true,
      purpose: 'LOGIN',
      challengeId: 'abc',
      email: 'a@b.com',
      expiresAt: new Date().toISOString(),
      resendCooldownSeconds: 60
    });

    service.saveSession(response, false);

    expect(service.getToken()).toBe('header.payload.sig');
    expect(service.getUser()?.email).toBe('a@b.com');
    expect(service.getPendingChallenge()).toBeNull();
  });

  // =========================
  // Password recovery
  // =========================

  it('forgotPassword posts to /auth/forgot-password', () => {
    service.forgotPassword({
      identifier: 'a@b.com',
      phone: '01000000000'
    }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      identifier: 'a@b.com',
      phone: '01000000000'
    });
    req.flush({
      success: true,
      message: 'ok',
      data: {
        requiresVerification: true,
        purpose: 'PASSWORD_RESET',
        challengeId: 'rc1',
        expiresAt: new Date().toISOString(),
        resendCooldownSeconds: 60
      }
    });
  });

  it('verifyResetOtp posts to /auth/verify-reset-otp', () => {
    service.verifyResetOtp({ challengeId: 'rc1', otp: '123456' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/verify-reset-otp`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('resendResetOtp posts to /auth/resend-reset-otp', () => {
    service.resendResetOtp({ challengeId: 'rc1' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/resend-reset-otp`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('resetPassword posts to /auth/reset-password', () => {
    service.resetPassword({
      resetToken: 'tok',
      password: 'NewPass1'
    }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/auth/reset-password`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('stores pending reset challenge and reset authorization, then clears them', () => {
    service.setPendingResetChallenge({
      requiresVerification: true,
      purpose: 'PASSWORD_RESET',
      challengeId: 'rc1',
      expiresAt: new Date().toISOString(),
      resendCooldownSeconds: 60
    });

    expect(service.getPendingResetChallenge()?.challengeId).toBe('rc1');

    service.setResetAuthorization('reset-token', new Date().toISOString());
    expect(service.getResetAuthorization()?.resetToken).toBe('reset-token');

    // Recovery state never creates a login session.
    expect(service.getToken()).toBeNull();

    service.clearPasswordRecovery();
    expect(service.getPendingResetChallenge()).toBeNull();
    expect(service.getResetAuthorization()).toBeNull();
  });
});
