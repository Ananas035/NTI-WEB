import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { Returns } from './returns';
import { ApiService } from '../../services/api';

// A realistic saved-return document, as the backend returns it (items are
// populated with the product they refer to).
const sampleReturnDoc = {
  _id: 'r1',
  returnNumber: 'RET-0001',
  customer: {
    customerId: 1,
    name: 'Customer',
    showroomName: 'Showroom',
    mobileNumber: '01000000000'
  },
  date: '2026-01-05T10:00:00.000Z',
  items: [
    {
      modelCode: 1001,
      quantity: 2,
      unitPrice: 10,
      total: 20,
      product: { modelName: 'Model', modelCode: 1001 }
    },
    {
      modelCode: 1002,
      quantity: 1,
      unitPrice: 5,
      total: 5,
      product: { modelName: 'Model Two', modelCode: 1002 }
    }
  ],
  returnTotal: 25
};

// The Returns creation form only opens when customers AND products exist, so
// the stub returns one of each.
const apiStub = {
  get: (endpoint: string) => {
    if (endpoint === '/customers') {
      return of({
        success: true,
        data: [{
          _id: 'c1',
          customerId: 1,
          name: 'Customer',
          showroomName: 'Showroom',
          mobileNumber: '01000000000',
          address: 'Address'
        }]
      });
    }

    if (endpoint === '/products') {
      return of({
        success: true,
        data: [{
          _id: 'p1',
          modelName: 'Model',
          modelCode: 1001,
          price: 10,
          availablePieces: 5
        }]
      });
    }

    if (endpoint === '/factory-profile') {
      return of({ success: true, configured: false, data: null });
    }

    if (endpoint.startsWith('/returns/')) {
      return of({ success: true, data: sampleReturnDoc });
    }

    return of({ success: true, data: [] });
  },
  post: () => of({ success: true, data: sampleReturnDoc }),
  patch: () => of({ success: true, data: {} }),
  delete: () => of({ success: true, data: {} })
};

describe('Returns', () => {
  let component: Returns;
  let fixture: ComponentFixture<Returns>;

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
      imports: [Returns],
      providers: [
        provideRouter([{ path: 'returns', component: Returns }]),
        { provide: ApiService, useValue: apiStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Returns);
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
    const harness = await RouterTestingHarness.create('/returns?new=1');

    const routed =
      harness.routeDebugElement?.componentInstance as Returns;

    expect(routed.showModal).toBe(true);

    // The temporary flag is consumed so the URL returns to the list route.
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/returns');
  });

  it('keeps the list view on a normal visit', async () => {
    const harness = await RouterTestingHarness.create('/returns');

    const routed =
      harness.routeDebugElement?.componentInstance as Returns;

    expect(routed.showModal).toBe(false);
  });

  it('prepares a saved return document for download without changing the list', () => {
    const before = component.returnsData.length;

    component.openPrintReturn({
      id: 'RET-0001',
      customerId: 1,
      customerName: 'Customer',
      customerStore: 'Showroom',
      date: '2026-01-05',
      amount: 25,
      items: [
        {
          id: 1,
          modelCode: '1001',
          modelName: 'Model',
          quantity: 2,
          unitPrice: 10,
          total: 20
        }
      ]
    });

    expect(component.printableReturn).not.toBeNull();
    expect(component.printableReturn?.id).toBe('RET-0001');
    expect(component.printableReturn?.items.length).toBe(2);
    expect(component.printableReturn?.amount).toBe(25);
    expect(component.printingReturnId).toBeNull();
    expect(component.printError).toBe('');

    // Generating the document is read-only: the returns list is untouched.
    expect(component.returnsData.length).toBe(before);
  });

  it('computes the total pieces shown on the return document', () => {
    const total = component.calculateTotalPieces([
      {
        id: 1,
        modelCode: '1001',
        modelName: 'Model',
        quantity: 2,
        unitPrice: 10,
        total: 20
      },
      {
        id: 2,
        modelCode: '1002',
        modelName: 'Model Two',
        quantity: 3,
        unitPrice: 5,
        total: 15
      }
    ]);

    expect(total).toBe(5);
  });

  it('saves a return and prepares the document when Save & Print is used', () => {
    component.formCustomerId = 1;

    component.formItems = [
      {
        id: 1,
        modelCode: '1001',
        modelName: 'Model',
        quantity: 2,
        unitPrice: 10,
        total: 20
      }
    ];

    component.saveReturn(true);

    expect(component.printableReturn).not.toBeNull();
    expect(component.printableReturn?.id).toBe('RET-0001');
    expect(component.showModal).toBe(false);
    expect(component.isSaving).toBe(false);
  });

  it('does not prepare a document for a plain Save', () => {
    component.formCustomerId = 1;

    component.formItems = [
      {
        id: 1,
        modelCode: '1001',
        modelName: 'Model',
        quantity: 2,
        unitPrice: 10,
        total: 20
      }
    ];

    component.saveReturn();

    expect(component.printableReturn).toBeNull();
    expect(component.showModal).toBe(false);
  });
});
