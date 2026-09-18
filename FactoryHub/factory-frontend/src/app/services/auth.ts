import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from './api';
import {
  LoginRequest,
  LoginResponse,
  User
} from '../interfaces/interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(private api: ApiService) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>(
      '/auth/login',
      credentials
    );
  }

  
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