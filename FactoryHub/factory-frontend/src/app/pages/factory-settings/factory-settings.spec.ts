import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { FactorySettings } from './factory-settings';

describe('FactorySettings', () => {
  let component: FactorySettings;
  let fixture: ComponentFixture<FactorySettings>;
  let httpMock: HttpTestingController;

  const endpoint = 'http://localhost:5000/api/factory-profile';

  beforeEach(async () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: '1',
        name: 'Admin',
        email: 'admin@example.com',
        role: 'ADMIN'
      })
    );

    await TestBed.configureTestingModule({
      imports: [FactorySettings],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FactorySettings);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem('auth_user');
  });

  it('should create and load the saved values', () => {
    fixture.detectChanges();

    httpMock.expectOne(endpoint).flush({
      success: true,
      configured: true,
      data: {
        factoryName: 'Delta Textiles',
        managerName: 'Ahmed Ali',
        phone: '01234567890',
        logoUrl: '/uploads/factory/logo.png'
      }
    });

    fixture.detectChanges();

    expect(component.isAdmin).toBe(true);
    expect(component.factoryName).toBe('Delta Textiles');
    expect(component.managerName).toBe('Ahmed Ali');
    expect(component.phone).toBe('01234567890');
    expect(component.currentLogoUrl).toBe('/uploads/factory/logo.png');
    expect(component.logoDisplayUrl)
      .toBe('http://localhost:5000/uploads/factory/logo.png');
  });

  it('rejects an unsupported file type without uploading', () => {
    fixture.detectChanges();
    httpMock.expectOne(endpoint).flush({
      success: true,
      configured: false,
      data: null
    });
    fixture.detectChanges();

    const input = document.createElement('input');
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });
    Object.defineProperty(input, 'files', { value: [file] });

    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.logoFile).toBeNull();
    expect(component.errorMessage).toBe('fac_error_invalid_format');
    httpMock.expectNone(`${endpoint}/logo`);
  });

  it('saves the profile through the backend', () => {
    fixture.detectChanges();
    httpMock.expectOne(endpoint).flush({
      success: true,
      configured: false,
      data: null
    });
    fixture.detectChanges();

    component.factoryName = 'New Factory';
    component.phone = '0111222333';
    component.saveChanges();

    const putReq = httpMock.expectOne(endpoint);
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body.factoryName).toBe('New Factory');

    putReq.flush({
      success: true,
      data: { factoryName: 'New Factory', phone: '0111222333' }
    });

    // finishSave() refreshes the displayed information.
    httpMock.expectOne(endpoint).flush({
      success: true,
      configured: true,
      data: { factoryName: 'New Factory', phone: '0111222333' }
    });

    expect(component.successMessage).toBe('fac_success_saved');
    expect(component.isSaving).toBe(false);
  });

  it('blocks saving when required fields are empty', () => {
    fixture.detectChanges();
    httpMock.expectOne(endpoint).flush({
      success: true,
      configured: true,
      data: { factoryName: 'Delta', phone: '0100' }
    });
    fixture.detectChanges();

    component.factoryName = '';
    component.saveChanges();

    expect(component.errorMessage).toBe('fac_error_required');
    httpMock.expectNone(endpoint);
  });
});
