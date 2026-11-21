import {
  Component,
  ChangeDetectorRef,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth';
import { FactoryProfileService } from '../../services/factory-profile';
import { FactoryProfile } from '../../interfaces/interface';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-factory-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslatePipe
  ],
  templateUrl: './factory-settings.html',
  styleUrl: './factory-settings.css'
})
export class FactorySettings implements OnInit {

  constructor(
    private authService: AuthService,
    private profileService: FactoryProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================
  // Permissions
  // =========================

  // Only a factory administrator (ADMIN) may edit the profile. The backend
  // enforces this independently; this flag only drives the UI state.
  isAdmin = false;

  // =========================
  // Loading / Saving
  // =========================

  isLoading = true;
  isSaving = false;

  // =========================
  // Messages (translation keys)
  // =========================

  successMessage = '';
  errorMessage = '';

  // =========================
  // Form Fields
  // =========================

  factoryName = '';
  managerName = '';
  phone = '';
  address = '';
  email = '';

  fieldErrors: Record<string, boolean> = {};

  // =========================
  // Logo
  // =========================

  // Currently saved logo (relative path from the backend).
  currentLogoUrl = '';

  // Newly selected file, not yet persisted.
  logoFile: File | null = null;

  // Data-URL preview of the selected file (shown before saving).
  logoPreview = '';

  // Allowed image MIME types and maximum size — mirror the backend limits.
  readonly allowedLogoTypes = [
    'image/png',
    'image/jpeg',
    'image/webp'
  ];
  readonly maxLogoBytes = 3 * 1024 * 1024;

  // =========================
  // Lifecycle
  // =========================

  ngOnInit(): void {

    const user = this.authService.getUser();
    this.isAdmin = user?.role === 'ADMIN';

    this.loadProfile();
  }

  // =========================
  // Load
  // =========================

  loadProfile(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.profileService.loadProfile().subscribe({

      next: (response) => {

        this.applyProfile(response.data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },

      error: (error) => {

        console.error(
          'Factory Profile Load Error:',
          error
        );

        this.isLoading = false;
        this.errorMessage = this.mapError(
          error,
          'fac_error_load'
        );

        this.cdr.detectChanges();
      }
    });
  }

  private applyProfile(
    profile: FactoryProfile | null
  ): void {

    this.factoryName = profile?.factoryName || '';
    this.managerName = profile?.managerName || '';
    this.phone = profile?.phone || '';
    this.address = profile?.address || '';
    this.email = profile?.email || '';
    this.currentLogoUrl = profile?.logoUrl || '';
  }

  // =========================
  // Logo Selection
  // =========================

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.successMessage = '';
    this.errorMessage = '';

    if (!this.allowedLogoTypes.includes(file.type)) {

      this.logoFile = null;
      this.logoPreview = '';
      this.errorMessage = 'fac_error_invalid_format';
      input.value = '';

      this.cdr.detectChanges();
      return;
    }

    if (file.size > this.maxLogoBytes) {

      this.logoFile = null;
      this.logoPreview = '';
      this.errorMessage = 'fac_error_file_too_large';
      input.value = '';

      this.cdr.detectChanges();
      return;
    }

    this.logoFile = file;

    const reader = new FileReader();

    reader.onload = () => {

      this.logoPreview = String(reader.result || '');
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }

  clearSelectedLogo(): void {

    this.logoFile = null;
    this.logoPreview = '';
  }

  // The URL actually shown: the pending preview if a file was chosen,
  // otherwise the saved logo resolved to an absolute URL.
  get logoDisplayUrl(): string {

    if (this.logoPreview) {
      return this.logoPreview;
    }

    return this.profileService.resolveLogoUrl(
      this.currentLogoUrl
    );
  }

  get hasLogo(): boolean {

    return Boolean(
      this.logoPreview ||
      this.currentLogoUrl
    );
  }

  // =========================
  // Save
  // =========================

  saveChanges(): void {

    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isAdmin) {

      this.errorMessage = 'fac_error_permission';
      return;
    }

    if (!this.validate()) {
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const payload = {
      factoryName: this.factoryName.trim(),
      managerName: this.managerName.trim(),
      phone: this.phone.trim(),
      address: this.address.trim(),
      email: this.email.trim()
    };

    this.profileService.updateProfile(payload).subscribe({

      next: () => {

        // Persist the logo only after the profile text is safely stored, so a
        // logo failure can never leave the profile in an inconsistent state.
        if (this.logoFile) {

          this.uploadSelectedLogo();

        } else {

          this.finishSave();
        }
      },

      error: (error) => {

        console.error(
          'Factory Profile Save Error:',
          error
        );

        this.isSaving = false;
        this.errorMessage = this.mapError(
          error,
          'fac_error_save'
        );

        this.cdr.detectChanges();
      }
    });
  }

  private uploadSelectedLogo(): void {

    const file = this.logoFile;

    if (!file) {
      this.finishSave();
      return;
    }

    this.profileService.uploadLogo(file).subscribe({

      next: () => {
        this.finishSave();
      },

      error: (error) => {

        console.error(
          'Factory Logo Upload Error:',
          error
        );

        // The profile text was saved successfully; only the logo failed.
        this.isSaving = false;
        this.errorMessage = this.mapError(
          error,
          'fac_error_logo'
        );

        this.cdr.detectChanges();
      }
    });
  }

  private finishSave(): void {

    this.isSaving = false;
    this.logoFile = null;
    this.logoPreview = '';
    this.successMessage = 'fac_success_saved';

    // Refresh the displayed information from the backend.
    this.profileService.loadProfile().subscribe({

      next: (response) => {

        this.applyProfile(response.data);
        this.cdr.detectChanges();
      },

      error: () => {
        // Non-fatal: the save already succeeded.
      }
    });

    this.cdr.detectChanges();
  }

  private validate(): boolean {

    this.fieldErrors = {};
    let valid = true;

    if (!this.factoryName.trim()) {
      this.fieldErrors['factoryName'] = true;
      valid = false;
    }

    if (!this.phone.trim()) {
      this.fieldErrors['phone'] = true;
      valid = false;
    }

    if (!valid) {

      this.errorMessage = 'fac_error_required';
      this.cdr.detectChanges();
      return false;
    }

    if (
      this.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        this.email.trim()
      )
    ) {

      this.fieldErrors['email'] = true;
      this.errorMessage = 'fac_error_invalid_email';
      this.cdr.detectChanges();
      return false;
    }

    return true;
  }

  // =========================
  // Error Mapping
  // =========================

  private mapError(
    error: any,
    fallback: string
  ): string {

    const status = error?.status;

    if (status === 401) {
      return 'fac_error_unauthorized';
    }

    if (status === 403) {
      return 'fac_error_permission';
    }

    if (status === 400) {
      return 'fac_error_validation';
    }

    return fallback;
  }
}
