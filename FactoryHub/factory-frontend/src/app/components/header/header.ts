import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  HostListener
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { LangSwitcher } from '../lang-switcher/lang-switcher';
import { TranslatePipe } from '../../pipes/translate-pipe';

import { AuthService } from '../../services/auth';
import { User } from '../../interfaces/interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    LangSwitcher,
    TranslatePipe
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  @Output() toggleSidebarEvent =
    new EventEmitter<void>();

  user: User | null = null;

  isProfileOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user =
      this.authService.getUser();
  }

  onToggleSidebar(): void {
    this.toggleSidebarEvent.emit();
  }

  toggleProfile(): void {
    this.isProfileOpen =
      !this.isProfileOpen;
  }

  closeProfile(): void {
    this.isProfileOpen = false;
  }

  logout(): void {
    this.isProfileOpen = false;

    this.authService.logout();

    this.router.navigate(['/login']);
  }

  getUserName(): string {
  return this.user?.name?.trim() || '';
}

  getUserInitial(): string {
    const name =
      this.user?.name?.trim();

    if (!name) {
      return 'U';
    }

    return name.charAt(0);
  }

  getUserRole(): string {
    if (this.user?.role === 'ADMIN') {
      return 'role_admin';
    }

    return 'role_user';
  }

  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    const target =
      event.target as HTMLElement;

    if (!target.closest('.user-menu')) {
      this.isProfileOpen = false;
    }
  }
}