import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ApiErrorResponse } from '../models/api-responses';

/**
 * Error Handler Service
 * Centralized error handling for HTTP requests
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  /**
   * Handle HTTP errors and return formatted error
   */
  handleError(error: HttpErrorResponse): Observable<never> {
    const errorMessage = this.getErrorMessage(error);
    
    console.error('API Error:', error);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Extract user-friendly error message from response
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Check for API error response
    if (error.error && typeof error.error === 'object') {
      const apiError = error.error as ApiErrorResponse;
      if (apiError.detail) {
        return apiError.detail;
      }
    }

    // HTTP status code messages
    switch (error.status) {
      case 0:
        return 'Network error. Please check your connection.';
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Error: ${error.statusText || 'An error occurred'}`;
    }
  }
}
