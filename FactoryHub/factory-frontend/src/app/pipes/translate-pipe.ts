import { Pipe, PipeTransform } from '@angular/core';
import { Language } from '../services/language';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private langService: Language) {}

  transform(key: string): string {
    return this.langService.translate(key);
  }
}