/**
 * Error Type Definitions
 *
 * Structured error types for the application.
 * Provides type-safe error handling and recovery.
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Authentication & Authorization Errors
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required", details?: Record<string, any>) {
    super("AUTH_REQUIRED", message, 401, details);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Permission denied", details?: Record<string, any>) {
    super("AUTH_FORBIDDEN", message, 403, details);
    this.name = "AuthorizationError";
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(
    message: string,
    public fields: Record<string, string[]> = {}
  ) {
    super("VALIDATION_FAILED", message, 400, { fields });
    this.name = "ValidationError";
  }
}

// Resource Errors
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super("NOT_FOUND", message, 404, { resource, id });
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super("CONFLICT", message, 409, details);
    this.name = "ConflictError";
  }
}

// Business Logic Errors
export class InvalidStateError extends AppError {
  constructor(
    message: string,
    public currentState?: string
  ) {
    super("INVALID_STATE", message, 400, { currentState });
    this.name = "InvalidStateError";
  }
}

export class InsufficientFundsError extends AppError {
  constructor(available: number, required: number) {
    super(
      "INSUFFICIENT_FUNDS",
      `Insufficient funds. Available: ${available}, Required: ${required}`,
      400,
      { available, required }
    );
    this.name = "InsufficientFundsError";
  }
}

// External Service Errors
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super("EXTERNAL_SERVICE_ERROR", `Error communicating with ${service}: ${message}`, 502, {
      service,
    });
    this.name = "ExternalServiceError";
  }
}

// Database Errors
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public operation?: string
  ) {
    super("DATABASE_ERROR", `Database error during ${operation || "operation"}: ${message}`, 500, {
      operation,
    });
    this.name = "DatabaseError";
  }
}

// Rate Limit & Quota Errors
export class RateLimitError extends AppError {
  constructor(public retryAfter: number) {
    super("RATE_LIMIT_EXCEEDED", `Rate limit exceeded. Retry after ${retryAfter}s`, 429, {
      retryAfter,
    });
    this.name = "RateLimitError";
  }
}

// Generic Server Error
export class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super("INTERNAL_ERROR", message, 500);
    this.name = "InternalServerError";
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is a specific error type
 */
export function isErrorType<T extends AppError>(
  error: unknown,
  ErrorClass: new (...args: any[]) => T
): error is T {
  return error instanceof ErrorClass;
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to detect error type from message
    if (error.message.includes("UNIQUE violation")) {
      return new ConflictError("This item already exists");
    }
    if (error.message.includes("FK violation")) {
      return new InvalidStateError("Cannot perform this operation due to related data");
    }
    if (error.message.includes("timeout")) {
      return new ExternalServiceError("Database", "Connection timeout");
    }

    return new InternalServerError(error.message);
  }

  return new InternalServerError("An unknown error occurred");
}
