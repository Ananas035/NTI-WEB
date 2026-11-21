import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigateCreate asks the destination page to open its create form', () => {
    const router = TestBed.inject(Router);

    let captured:
      { commands: unknown[]; extras?: unknown } | null = null;

    router.navigate = ((commands: unknown[], extras?: unknown) => {
      captured = { commands, extras };
      return Promise.resolve(true);
    }) as unknown as Router['navigate'];

    component.navigateCreate('/invoices');

    expect(captured).toEqual({
      commands: ['/invoices'],
      extras: { queryParams: { new: '1' } }
    });
  });
});
