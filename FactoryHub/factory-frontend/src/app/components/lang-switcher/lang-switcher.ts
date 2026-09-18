import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Language } from '../../services/language';

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-switcher.html',
  styleUrl: './lang-switcher.css'
})
export class LangSwitcher {
  constructor(public langService: Language) {}

  switchLanguage() {
    this.langService.toggleLanguage();
  }
}