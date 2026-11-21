import { ForgotPassword } from './forgot-password';

// Lightweight unit tests for the account-identification form. Dependencies are
// stubbed so no TestBed/router is required.
const createComponent = () => {
  const router = { navigate: () => {} } as any;
  const auth = {
    forgotPassword: () => ({ subscribe: () => {} }),
    setPendingResetChallenge: () => {},
    clearPasswordRecovery: () => {}
  } as any;
  const cdr = { detectChanges: () => {} } as any;
  const language = {
    currentLang: 'ar',
    toggleLanguage: () => {}
  } as any;

  return new ForgotPassword(router, auth, cdr, language);
};

describe('ForgotPassword', () => {

  it('should be created', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('strips disallowed characters from the phone field', () => {
    const component = createComponent();

    component.onPhoneInput('01a0-123 4567!');

    expect(component.phone).toBe('010-123 4567');
  });

  it('requires both fields before submitting', () => {
    const component = createComponent();

    component.onSubmit();

    expect(component.errorMessage).toBe('forgot_error_required');
    expect(component.isLoading).toBe(false);
  });

  it('rejects a phone number that is too short', () => {
    const component = createComponent();

    component.onIdentifierInput('a@b.com');
    component.onPhoneInput('123');
    component.onSubmit();

    expect(component.errorMessage).toBe('forgot_error_invalid_phone');
  });
});
