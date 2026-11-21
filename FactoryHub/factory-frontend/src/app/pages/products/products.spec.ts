import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { Products } from './products';
import { ApiService } from '../../services/api';

// Minimal API stub — the Products page only needs GET /products to render.
const apiStub = {
  get: () => of({ success: true, data: [] }),
  post: () => of({ success: true, data: {} }),
  patch: () => of({ success: true, data: {} }),
  delete: () => of({ success: true, data: {} })
};

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideRouter([{ path: 'products', component: Products }]),
        { provide: ApiService, useValue: apiStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens the create form when reached via the Quick Action (?new=1)', async () => {
    const harness = await RouterTestingHarness.create('/products?new=1');

    const routed =
      harness.routeDebugElement?.componentInstance as Products;

    expect(routed.showModal).toBe(true);

    // The temporary flag is consumed so the URL returns to the list route.
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/products');
  });

  it('keeps the list view on a normal visit', async () => {
    const harness = await RouterTestingHarness.create('/products');

    const routed =
      harness.routeDebugElement?.componentInstance as Products;

    expect(routed.showModal).toBe(false);
  });
});
