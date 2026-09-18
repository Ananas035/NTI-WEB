import { Component, Input } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../pipes/translate-pipe';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  @Input() isCollapsed = false;

  constructor(private router: Router) {}

  navItems = [
    { id: 'dashboard', path: '/dashboard', labelKey: 'nav_dashboard', icon: 'M2 10.5a8.5 8.5 0 1 1 17 0M10 2v1m7.07 2.93-.7.7M18 10h-1M3.93 4.93l.7.7M3 10H2 M10 10 L13.5 6.5' },
    { id: 'accounts', path: '/accounts', labelKey: 'nav_accounts', icon: 'M2 9h16 M2 5h16v12H2z' },
    { id: 'products', path: '/products', labelKey: 'nav_products', icon: 'M10 2 L18 6.5 V13.5 L10 18 L2 13.5 V6.5 Z M10 2 L10 18M2 6.5 L10 11 L18 6.5' },
    { id: 'invoices', path: '/invoices', labelKey: 'nav_invoices', icon: 'M3 2h14v16H3z M7 7h6M7 10h6M7 13h4' },
    { id: 'returns', path: '/returns', labelKey: 'nav_returns', icon: 'M4 7h9a4 4 0 0 1 0 8H7 M7 4 L4 7 L7 10' },
    { id: 'inventory', path: '/inventory', labelKey: 'nav_inventory', icon: 'M2 18V9L10 3l8 6v9H2Z M7 12h6v6H7z' },
  ];

  onLogout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    this.router.navigate(['/login']);
  }
}