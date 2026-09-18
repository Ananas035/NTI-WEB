import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Products } from './pages/products/products';
import { Invoices } from './pages/invoices/invoices';
import { Returns } from './pages/returns/returns';
import { Accounts } from './pages/accounts/accounts';
import { Inventory } from './pages/inventory/inventory';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
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
    }
];