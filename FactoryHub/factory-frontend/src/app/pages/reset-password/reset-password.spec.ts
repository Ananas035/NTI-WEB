import { ResetPassword } from './reset-password';

// Lightweight unit tests for the new-password form validation. Dependencies are
// stubbed so no TestBed/router is required (ngOnInit is not invoked here).
const createComponent = () => {
  const router = { navigate: () => {} } as any;
  const auth = {
    getResetAuthorization: () => null,
    clearPasswordRecovery: () => {},
    resetPassword: () => ({ subscribe: () => {} })
  } as any;
  const cdr = { detectChanges: () => {} } as any;
  const language = {
    currentLang: 'ar',
    toggleLanguage: () => {}
  } as any;

  return new ResetPassword(router, auth, cdr, language);
};

describe('ResetPassword', () => {

  it('should be created', () => {
    expect(createComponent()).toBeTruthy();
  });

  it('detects matching passwords', () => {
    const component = createComponent();

    component.newPassword = 'NewPass1';
    component.confirmPassword = 'NewPass1';
    expect(component.passwordsMatch).toBe(true);

    component.confirmPassword = 'OtherPass1';
    expect(component.passwordsMatch).toBe(false);
  });

  it('is only valid with two matching passwords of sufficient length', () => {
    const component = createComponent();

    component.newPassword = '123';
    component.confirmPassword = '123';
    expect(component.isFormValid).toBe(false);

    component.newPassword = 'NewPass1';
    component.confirmPassword = 'NewPass1';
    expect(component.isFormValid).toBe(true);
  });

  it('reports a mismatch before calling the backend', () => {
    const component = createComponent();

    component.newPassword = 'NewPass1';
    component.confirmPassword = 'Different1';
    component.onSubmit();

    expect(component.errorMessage).toBe('reset_pw_error_mismatch');
    expect(component.isLoading).toBe(false);
  });

  it('reports a policy violation for short passwords', () => {
    const component = createComponent();

    component.newPassword = '123';
    component.confirmPassword = '123';
    component.onSubmit();

    expect(component.errorMessage).toBe('reset_pw_error_policy');
  });
});
