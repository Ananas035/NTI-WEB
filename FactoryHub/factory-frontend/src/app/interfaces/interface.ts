export interface Customer {
  id: number;
  name: string;
  store: string;
  mobile: string;
  address: string;
  joinDate: string;
  orders: number;
}

export interface ProductModel {
  id: number;
  name: string;
  code: string;
  pieces: number;
  colors: string[];
  createdAt: string;
  image?: string;
  price?: number;
}

export interface InvoiceItem {
  id: number;
  modelCode: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  customerId: number;
  customerName: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'partial';
  items: InvoiceItem[];
}

export interface ReturnItem {
  id: string;
  customerId: number;
  customerName: string;
  date: string;
  amount: number;
  items: InvoiceItem[];
}

export interface Payment {
  id: string;
  customerId: number;
  date: string;
  amount: number;
  notes: string;
}

export interface Check {
  id: string;
  customerId: number;
  customerName: string;
  issuerName?: string;
  bankName: string;
  date: string;
  amount: number;
  status: 'processed' | 'pending';
}

export interface AccountTransaction {
  id: string;
  date: string;
  type: 'invoice' | 'return' | 'payment' | 'check';
  refId: string;
  quantity: string | number;
  amount: number;
  balance?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'STAFF';
  isEmailVerified?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// The final authenticated response (only ever returned AFTER OTP verification).
export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// Matches the backend's `requiresVerification` challenge payload. Contains no
// token — it is only a reference to a pending OTP challenge.
export type OtpPurpose = 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';

export interface OtpChallengeData {
  requiresVerification: boolean;
  purpose: OtpPurpose;
  challengeId: string;
  email: string;
  expiresAt: string;
  resendCooldownSeconds: number;
  // Client-side only: whether the original login asked to be remembered.
  rememberMe?: boolean;
}

export interface OtpChallengeResponse {
  success: boolean;
  message: string;
  data: OtpChallengeData;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface VerifyOtpRequest {
  challengeId: string;
  otp: string;
}

export interface ResendOtpRequest {
  challengeId: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
  retryAfterSeconds?: number;
  data?: OtpChallengeData;
}

// =========================
// Forgot password / reset
// =========================

export interface ForgotPasswordRequest {
  // Registered username (User.name) or email address.
  identifier: string;
  phone: string;
}

// The password-reset challenge payload deliberately has NO email field — the
// backend never discloses the account's stored address.
export interface ResetChallengeData {
  requiresVerification: boolean;
  purpose: 'PASSWORD_RESET';
  challengeId: string;
  expiresAt: string;
  resendCooldownSeconds: number;
}

export interface ResetChallengeResponse {
  success: boolean;
  message: string;
  data: ResetChallengeData;
}

export interface VerifyResetOtpRequest {
  challengeId: string;
  otp: string;
}

// Returned only after a successful reset-OTP verification. `resetToken` is a
// short-lived, single-use authorization — NOT a login token.
export interface ResetAuthorizationResponse {
  success: boolean;
  message: string;
  data: {
    resetToken: string;
    expiresAt: string;
  };
}

export interface ResetPasswordRequest {
  resetToken: string;
  password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// =========================
// Factory profile / branding
// =========================

// The single authoritative factory identity used on invoices and documents.
// `logoUrl` is a relative public path (e.g. "/uploads/factory/logo.png").
export interface FactoryProfile {
  _id?: string;
  factoryName: string;
  managerName?: string;
  phone: string;
  address?: string;
  email?: string;
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FactoryProfileResponse {
  success: boolean;
  configured: boolean;
  data: FactoryProfile | null;
  message?: string;
}

export interface FactoryProfileMutationResponse {
  success: boolean;
  message?: string;
  data: FactoryProfile;
}