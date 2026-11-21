import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { Invoices } from './invoices';
import { ApiService } from '../../services/api';

// The invoice creation form only opens when customers AND products exist, so
// the stub returns one of each. An empty invoice list keeps numbering at
// INV-0000 for the test.
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
      return of({ success: true, data: null, configured: false });
    }

    return of({ success: true, data: [] });
  },
  post: () => of({ success: true, data: {} }),
  put: () => of({ success: true, data: {} }),
  patch: () => of({ success: true, data: {} }),
  delete: () => of({ success: true, data: {} })
};

describe('Invoices', () => {
  let component: Invoices;
  let fixture: ComponentFixture<Invoices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Invoices],
      providers: [
        provideRouter([{ path: 'invoices', component: Invoices }]),
        { provide: ApiService, useValue: apiStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Invoices);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the create form when reached via the Quick Action (?new=1)', async () => {
    const harness = await RouterTestingHarness.create('/invoices?new=1');

    const routed =
      harness.routeDebugElement?.componentInstance as Invoices;

    expect(routed.showCreateModal).toBe(true);

    // The temporary flag is consumed so the URL returns to the list route.
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/invoices');
  });

  it('keeps the list view on a normal visit', async () => {
    const harness = await RouterTestingHarness.create('/invoices');

    const routed =
      harness.routeDebugElement?.componentInstance as Invoices;

    expect(routed.showCreateModal).toBe(false);
  });
});
