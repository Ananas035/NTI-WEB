import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController
} from '@angular/common/http/testing';

import { FactoryProfileService } from './factory-profile';

describe('FactoryProfileService', () => {
  let service: FactoryProfileService;
  let httpMock: HttpTestingController;

  const endpoint = 'http://localhost:5000/api/factory-profile';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FactoryProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loads the profile and marks it configured', () => {
    service.loadProfile().subscribe();

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('GET');

    req.flush({
      success: true,
      configured: true,
      data: {
        factoryName: 'Delta Textiles',
        phone: '01234567890',
        logoUrl: '/uploads/factory/logo.png'
      }
    });

    expect(service.profile?.factoryName).toBe('Delta Textiles');
    expect(service.isConfigured).toBe(true);
  });

  it('resolves relative logo URLs to absolute URLs', () => {
    expect(service.resolveLogoUrl('/uploads/factory/logo.png'))
      .toBe('http://localhost:5000/uploads/factory/logo.png');

    expect(service.resolveLogoUrl('https://cdn.example.com/logo.png'))
      .toBe('https://cdn.example.com/logo.png');

    expect(service.resolveLogoUrl('')).toBe('');
    expect(service.resolveLogoUrl(undefined)).toBe('');
  });

  it('uploads the logo as multipart FormData without a JSON content type', () => {
    const file = new File(
      [new Uint8Array([1, 2, 3])],
      'logo.png',
      { type: 'image/png' }
    );

    service.uploadLogo(file).subscribe();

    const req = httpMock.expectOne(`${endpoint}/logo`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.headers.has('Content-Type')).toBe(false);

    req.flush({
      success: true,
      data: {
        factoryName: 'Delta Textiles',
        phone: '01234567890',
        logoUrl: '/uploads/factory/new-logo.png'
      }
    });

    expect(service.profile?.logoUrl).toBe('/uploads/factory/new-logo.png');
  });
});
