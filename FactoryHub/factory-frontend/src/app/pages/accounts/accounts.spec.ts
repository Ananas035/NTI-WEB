import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  provideHttpClient
} from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { Accounts } from './accounts';

describe('Accounts', () => {
  let component: Accounts;
  let fixture: ComponentFixture<Accounts>;

  let printSpy: ReturnType<typeof vi.fn>;
  let originalPrint: typeof window.print;

  beforeEach(async () => {
    printSpy = vi.fn();
    originalPrint = window.print;
    Object.defineProperty(window, 'print', {
      value: printSpy,
      configurable: true,
      writable: true
    });

    await TestBed.configureTestingModule({
      imports: [Accounts],
      providers: [
        provideRouter([{ path: 'accounts', component: Accounts }]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Accounts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    Object.defineProperty(window, 'print', {
      value: originalPrint,
      configurable: true,
      writable: true
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the create form when reached via the Quick Action (?new=1)', async () => {
    const harness = await RouterTestingHarness.create('/accounts?new=1');

    const routed =
      harness.routeDebugElement?.componentInstance as Accounts;

    expect(routed.showCustomerModal).toBe(true);

    // The temporary flag is consumed so the URL returns to the list route.
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/accounts');
  });

  it('keeps the list view on a normal visit', async () => {
    const harness = await RouterTestingHarness.create('/accounts');

    const routed =
      harness.routeDebugElement?.componentInstance as Accounts;

    expect(routed.showCustomerModal).toBe(false);
  });

  it('opens the statement period picker for a customer', () => {
    component.openStatementPeriodModal({
      id: 7,
      backendId: 'b7',
      name: 'Customer',
      store: 'Showroom',
      mobile: '01000000000',
      address: 'Cairo',
      joinDate: '2026-01-01',
      orders: 0
    });

    expect(component.showStatementPeriodModal).toBe(true);
    expect(component.statementPeriodCustomer?.id).toBe(7);
    expect(component.statementPeriod).toBe('1m');

    component.selectStatementPeriod('6m');
    expect(component.statementPeriod).toBe('6m');
  });

  it('requests the backend statement for the selected period and prepares it for print', () => {
    const http = TestBed.inject(HttpTestingController);

    // Drain the page's initial loads so only the statement request matches.
    http
      .match((r) => r.url.endsWith('/customers'))
      .forEach((r) => r.flush({ success: true, data: [] }));

    http
      .match((r) => r.url.endsWith('/factory-profile'))
      .forEach((r) =>
        r.flush({ success: true, configured: false, data: null })
      );

    component.openStatementPeriodModal({
      id: 7,
      backendId: 'b7',
      name: 'Customer',
      store: 'Showroom',
      mobile: '01000000000',
      address: 'Cairo',
      joinDate: '2026-01-01',
      orders: 0
    });

    component.selectStatementPeriod('3m');
    component.generateStatementPdf();

    const request = http.expectOne(
      (r) =>
        r.url.includes('/accounts/customer/7/statement') &&
        r.url.includes('period=3m')
    );

    request.flush({
      success: true,
      statement: {
        generatedAt: '2026-10-18T09:00:00.000Z',
        period: {
          key: '3m',
          months: 3,
          from: '2026-07-18T00:00:00.000Z',
          to: '2026-10-18T23:59:59.999Z',
          fromDate: '2026-07-18',
          toDate: '2026-10-18'
        },
        customer: { customerId: 7, name: 'Customer' },
        openingBalance: 150,
        totals: { sales: 300, returns: 150, payments: 30 },
        closingBalance: 270,
        currentBalance: 270,
        reconciled: true,
        transactions: []
      }
    });

    expect(component.printableStatement).not.toBeNull();
    expect(component.printableStatement?.closingBalance).toBe(270);
    expect(component.printableStatement?.period.toDate).toBe('2026-10-18');
    expect(component.showStatementPeriodModal).toBe(false);
    expect(component.isExportingStatement).toBe(false);
  });

  it('keeps the picker open and shows an error when the statement request fails', () => {
    const http = TestBed.inject(HttpTestingController);

    http
      .match((r) => r.url.endsWith('/customers'))
      .forEach((r) => r.flush({ success: true, data: [] }));

    http
      .match((r) => r.url.endsWith('/factory-profile'))
      .forEach((r) =>
        r.flush({ success: true, configured: false, data: null })
      );

    component.openStatementPeriodModal({
      id: 8,
      backendId: 'b8',
      name: 'Customer',
      store: 'Showroom',
      mobile: '01000000000',
      address: 'Cairo',
      joinDate: '2026-01-01',
      orders: 0
    });

    component.generateStatementPdf();

    const request = http.expectOne(
      (r) => r.url.includes('/accounts/customer/8/statement')
    );

    request.flush(
      { success: false, message: 'not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.statementPeriodError).toBe('acc_statement_error');
    expect(component.showStatementPeriodModal).toBe(true);
    expect(component.printableStatement).toBeNull();
    expect(component.isExportingStatement).toBe(false);
  });
});
