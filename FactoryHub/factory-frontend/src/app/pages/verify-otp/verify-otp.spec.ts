import { VerifyOtp } from './verify-otp';

// Lightweight unit test for the OTP input handling / validation logic.
// Dependencies are stubbed so no TestBed/router is required.
const createComponent = () => {
  const router = { navigate: () => {} } as any;
  const auth = {
    getPendingChallenge: () => null,
    setPendingChallenge: () => {},
    clearPendingChallenge: () => {},
    verifyOtp: () => ({ subscribe: () => {} }),
    resendOtp: () => ({ subscribe: () => {} }),
    saveSession: () => {}
  } as any;
  const cdr = { detectChanges: () => {} } as any;
  const language = {
    currentLang: 'ar',
    toggleLanguage: () => {}
  } as any;

  return new VerifyOtp(router, auth, cdr, language);
};

describe('VerifyOtp', () => {

  it('should be created', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('keeps only numeric characters', () => {
    const component = createComponent();

    component.onOtpInput('1a2b3c');

    expect(component.otp).toBe('123');
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
