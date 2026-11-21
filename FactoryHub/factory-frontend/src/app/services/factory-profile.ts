import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from './api';
import {
  FactoryProfile,
  FactoryProfileMutationResponse,
  FactoryProfileResponse
} from '../interfaces/interface';

// Single source of truth for the factory identity across the app.
//
// The database remains authoritative: this service holds only a cached copy so
// components (e.g. the invoice printer) can render the current branding without
// re-fetching on every action. `loadProfile()` refreshes the cache from the API.
@Injectable({
  providedIn: 'root'
})
export class FactoryProfileService {

  // Origin the backend serves /uploads from. Kept in one place so every
  // consumer resolves logo URLs identically.
  readonly backendBaseUrl = 'http://localhost:5000';

  private readonly profileSubject =
    new BehaviorSubject<FactoryProfile | null>(null);
  readonly profile$ = this.profileSubject.asObservable();

  private readonly configuredSubject = new BehaviorSubject<boolean>(false);
  readonly configured$ = this.configuredSubject.asObservable();

  constructor(private api: ApiService) {}

  get profile(): FactoryProfile | null {
    return this.profileSubject.value;
  }

  // =========================
  // API
  // =========================

  // Fetch the current profile from the backend and refresh the cache.
  loadProfile(): Observable<FactoryProfileResponse> {
    return this.api
      .get<FactoryProfileResponse>('/factory-profile')
      .pipe(
        tap((response) => {
          this.profileSubject.next(response.data ?? null);
          this.configuredSubject.next(response.configured === true);
        })
      );
  }

  // Create or update the profile (ADMIN only, enforced by the backend).
  updateProfile(
    payload: Partial<FactoryProfile>
  ): Observable<FactoryProfileMutationResponse> {
    return this.api
      .put<FactoryProfileMutationResponse>('/factory-profile', payload)
      .pipe(
        tap((response) => {
          if (response?.data) {
            this.profileSubject.next(response.data);
            this.configuredSubject.next(true);
          }
        })
      );
  }

  // Upload / replace the logo. ApiService intentionally does NOT set a JSON
  // Content-Type for FormData so the browser adds the multipart boundary.
  uploadLogo(file: File): Observable<FactoryProfileMutationResponse> {
    const formData = new FormData();
    formData.append('logo', file);

    return this.api
      .post<FactoryProfileMutationResponse>(
        '/factory-profile/logo',
        formData
      )
      .pipe(
        tap((response) => {
          if (response?.data) {
            this.profileSubject.next(response.data);
            this.configuredSubject.next(true);
          }
        })
      );
  }

  // =========================
  // Helpers
  // =========================

  // Turn a stored relative logo path into an absolute URL the browser can use.
  // Absolute URLs are returned untouched; missing values return ''.
  resolveLogoUrl(logoUrl?: string): string {
    if (!logoUrl) {
      return '';
    }

    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      return logoUrl;
    }

    if (logoUrl.startsWith('/')) {
      return `${this.backendBaseUrl}${logoUrl}`;
    }

    return `${this.backendBaseUrl}/${logoUrl}`;
  }

  get isConfigured(): boolean {
    return this.configuredSubject.value;
  }
}
