import { VerifyResetOtp } from './verify-reset-otp';

// Lightweight unit tests for the reset-OTP input handling. Dependencies are
// stubbed so no TestBed/router is required (ngOnInit is not invoked here).
const createComponent = () => {
  const router = { navigate: () => {} } as any;
  const auth = {
    getPendingResetChallenge: () => null,
    setPendingResetChallenge: () => {},
    clearPendingResetChallenge: () => {},
    setResetAuthorization: () => {},
    verifyResetOtp: () => ({ subscribe: () => {} }),
    resendResetOtp: () => ({ subscribe: () => {} })
  } as any;
  const cdr = { detectChanges: () => {} } as any;
  const language = {
    currentLang: 'ar',
    toggleLanguage: () => {}
  } as any;

  return new VerifyResetOtp(router, auth, cdr, language);
};

describe('VerifyResetOtp', () => {

  it('should be created', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('keeps only numeric characters', () => {
    const component = createComponent();

    component.onOtpInput('9x8y7z');

    expect(component.otp).toBe('987');
  });

  it('limits the code to 6 digits', () => {
    const component = createComponent();

    component.onOtpInput('1234567890');

    expect(component.otp).toBe('123456');
  });

  it('reports completeness only for exactly 6 digits', () => {
    const component = createComponent();

    component.onOtpInput('12345');
    expect(component.isCodeComplete).toBe(false);

    component.onOtpInput('123456');
    expect(component.isCodeComplete).toBe(true);
  });
});
