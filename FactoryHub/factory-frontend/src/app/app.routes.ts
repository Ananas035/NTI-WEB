import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Products } from './pages/products/products';
import { Invoices } from './pages/invoices/invoices';
import { Returns } from './pages/returns/returns';
import { Accounts } from './pages/accounts/accounts';
import { Inventory } from './pages/inventory/inventory';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { VerifyOtp } from './pages/verify-otp/verify-otp';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { VerifyResetOtp } from './pages/verify-reset-otp/verify-reset-otp';
import { ResetPassword } from './pages/reset-password/reset-password';
import { FactorySettings } from './pages/factory-settings/factory-settings';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [

    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'signup',
        component: Signup
    },
    {
        // Reachable WITHOUT authentication — it is the step that establishes
        // the session. The component itself redirects to /login when there is
        // no pending challenge.
        path: 'verify-otp',
        component: VerifyOtp
    },
    {
        // Password recovery — stage 1: identify the account (identifier+phone).
        path: 'forgot-password',
        component: ForgotPassword
    },
    {
        // Password recovery — stage 2: verify the reset OTP. The component
        // redirects to /forgot-password when there is no pending challenge.
        path: 'verify-reset-otp',
        component: VerifyResetOtp
    },
    {
        // Password recovery — stage 3: set the new password. Guarded by the
        // component (and independently by the backend) against direct access
        // without a valid reset authorization.
        path: 'reset-password',
        component: ResetPassword
    },
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [authGuard]
    },
    {
        path: 'products',
        component: Products,
        canActivate: [authGuard]
    },
    {
        path: 'invoices',
        component: Invoices,
        canActivate: [authGuard]
    },
    {
        path: 'returns',
        component: Returns,
        canActivate: [authGuard]
    },
    {
        path: 'accounts',
        component: Accounts,
        canActivate: [authGuard]
    },
    {
        path: 'inventory',
        component: Inventory,
        canActivate: [authGuard]
    },
    {
        // Factory identity / branding. Readable by any authenticated user;
        // editing is enforced as ADMIN-only by the backend.
        path: 'factory-settings',
        component: FactorySettings,
        canActivate: [authGuard]
    }
];