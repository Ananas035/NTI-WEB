import { TranslatePipe } from './translate-pipe';
import { Language } from '../services/language';

describe('TranslatePipe', () => {

  it('create an instance', () => {
    const lang = { translate: (key: string) => key } as unknown as Language;
    const pipe = new TranslatePipe(lang);
    expect(pipe).toBeTruthy();
  });

  it('delegates translation to the language service', () => {
    const lang = {
      translate: (key: string) => `t:${key}`
    } as unknown as Language;

    const pipe = new TranslatePipe(lang);

    expect(pipe.transform('login_title')).toBe('t:login_title');
  });
});
