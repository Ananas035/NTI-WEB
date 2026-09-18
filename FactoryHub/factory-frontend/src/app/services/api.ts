import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly baseUrl = 'http://localhost:5000/api';
  private readonly tokenKey = 'auth_token';

  constructor(private http: HttpClient) {}

  /**
   * Get token from localStorage or sessionStorage
   */
  private getToken(): string | null {
    return (
      localStorage.getItem(this.tokenKey) ||
      sessionStorage.getItem(this.tokenKey)
    );
  }


  //  * Create request headers.
  private getHeaders(body?: unknown): HttpHeaders {
    let headers = new HttpHeaders();

    const token = this.getToken();

    if (token) {
      headers = headers.set(
        'Authorization',
        `Bearer ${token}`
      );
    }

    // JSON only when body is NOT FormData
    if (!(body instanceof FormData)) {
      headers = headers.set(
        'Content-Type',
        'application/json'
      );
    }

    return headers;
  }


    // GET

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(
      `${this.baseUrl}${endpoint}`,
      {
        headers: this.getHeaders()
      }
    );
  }


    // POST

  post<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {
    return this.http.post<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      {
        headers: this.getHeaders(body)
      }
    );
  }


  //   PUT

  put<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {
    return this.http.put<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      {
        headers: this.getHeaders(body)
      }
    );
  }


  //   PATCH

  patch<T>(
    endpoint: string,
    body: unknown
  ): Observable<T> {
    return this.http.patch<T>(
      `${this.baseUrl}${endpoint}`,
      body,
      {
        headers: this.getHeaders(body)
      }
    );
  }

  //   DELETE

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(
      `${this.baseUrl}${endpoint}`,
      {
        headers: this.getHeaders()
      }
    );
  }
}