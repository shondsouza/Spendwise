/**
 * Server-Side Error Handler
 *
 * Centralized error handling for server actions.
 * Formats errors for client consumption.
 * Provides logging and error recovery.
 */

import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  InvalidStateError,
  InsufficientFundsError,
  ExternalServiceError,
  DatabaseError,
  RateLimitError,
  InternalServerError,
  toAppError,
} from "./error-types";

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
    fields?: Record<string, string[]>; // For validation errors
  };
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Formats AppError for client consumption
 */
export function formatErrorResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      fields: error instanceof ValidationError ? error.fields : undefined,
    },
  };
}

/**
 * Formats success response for consistency
 */
export function formatSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Wraps server action handler with error handling
 *
 * Usage:
 * ```typescript
 * export const addExpense = withErrorHandling(
 *   protectedAction(async (userId, formData) => {
 *     // Your logic - errors are automatically caught and formatted
 *   })
 * );
 * ```
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: {
    logErrors?: boolean;
    userId?: string;
    action?: string;
  } = {}
): T {
  return (async (...args: any[]) => {
    try {
      const result = await handler(...args);
      return formatSuccessResponse(result);
    } catch (error) {
      const appError = toAppError(error);

      // Log errors in development
      if (options.logErrors !== false && process.env.NODE_ENV === "development") {
        console.error("[ERROR]", {
          action: options.action,
          userId: options.userId,
          code: appError.code,
          message: appError.message,
          statusCode: appError.statusCode,
          originalError: error,
        });
      }

      return formatErrorResponse(appError);
    }
  }) as T;
}

/**
 * Helper to handle errors in client components
 * Converts error response to user-friendly toast message
 */
export function getErrorMessage(error: ErrorResponse["error"]): string {
  const userMessages: Record<string, string> = {
    AUTH_REQUIRED: "Please log in to continue",
    AUTH_FORBIDDEN: "You do not have permission to perform this action",
    VALIDATION_FAILED: "Please check your input and try again",
    NOT_FOUND: "The item you are looking for was not found",
    CONFLICT: "This item already exists",
    INVALID_STATE: "Cannot perform this action in the current state",
    INSUFFICIENT_FUNDS: "You have insufficient funds",
    EXTERNAL_SERVICE_ERROR: "A service is temporarily unavailable",
    DATABASE_ERROR: "A database error occurred",
    RATE_LIMIT_EXCEEDED: "You are making requests too quickly. Please wait.",
    INTERNAL_ERROR: "Something went wrong. Please try again.",
  };

  return userMessages[error.code] || error.message;
}

/**
 * Helper to handle validation errors specifically
 */
export function getValidationErrors(
  error: ErrorResponse["error"]
): Record<string, string[]> | null {
  if (error.code === "VALIDATION_FAILED" && error.fields) {
    return error.fields;
  }
  return null;
}

/**
 * Safe error handler for use in catch blocks
 * Ensures consistent error response format
 */
export function handleError(error: unknown, context?: string): ErrorResponse {
  const appError = toAppError(error);

  if (process.env.NODE_ENV === "development" && context) {
    console.error(`[ERROR in ${context}]`, {
      code: appError.code,
      message: appError.message,
      originalError: error,
    });
  }

  return formatErrorResponse(appError);
}

/**
 * Specialized handler for database query errors
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  if (error instanceof Error) {
    throw new DatabaseError(error.message, operation);
  }
  throw new DatabaseError("Unknown database error", operation);
}

/**
 * Retry logic for transient errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? 100;
  const backoffMultiplier = options.backoffMultiplier ?? 2;

  let lastError: Error | null = null;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on auth/validation errors
      const appError = toAppError(error);
      if (
        appError instanceof AuthenticationError ||
        appError instanceof AuthorizationError ||
        appError instanceof ValidationError ||
        appError instanceof NotFoundError
      ) {
        throw appError;
      }

      // Only retry if more attempts remain
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffMultiplier;
      }
    }
  }

  throw lastError || new InternalServerError("Retry exhausted");
}

/**
 * Validates an object against a schema, throws ValidationError on failure
 */
export async function validateInput<T>(
  data: unknown,
  schema: { parseAsync: (data: unknown) => Promise<T> }
): Promise<T> {
  try {
    return await schema.parseAsync(data);
  } catch (error: any) {
    const fieldErrors: Record<string, string[]> = {};

    if (error.issues) {
      for (const issue of error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = [];
        }
        fieldErrors[path].push(issue.message);
      }
    }

    throw new ValidationError("Validation failed", fieldErrors);
  }
}
