/**
 * Server Action Auth Wrapper
 *
 * Provides centralized authentication for server actions.
 * Eliminates duplicate auth checks across actions.
 *
 * Usage:
 * ```typescript
 * export const addExpense = protectedAction(async (userId, formData) => {
 *   // Your logic here - userId is guaranteed to exist
 * });
 * ```
 */

import { createClient } from "@/lib/supabase/server";

export class AuthError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Not authorized to perform this action") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Wraps a server action to ensure user is authenticated.
 * Automatically handles auth check and provides userId.
 */
export function protectedAction<T extends unknown[], R>(
  handler: (userId: string, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      throw new AuthError("User session invalid or expired");
    }

    try {
      return await handler(user.id, ...args);
    } catch (err) {
      // Re-throw auth errors as-is, wrap others
      if (err instanceof AuthError || err instanceof AuthorizationError) {
        throw err;
      }
      throw err;
    }
  };
}

/**
 * Wraps a server action with optional user context.
 * Returns null if user is not authenticated.
 */
export function optionalAuthAction<T extends unknown[], R>(
  handler: (userId: string | null, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return await handler(user?.id ?? null, ...args);
  };
}

/**
 * Gets current user, throws if not authenticated.
 * Useful for individual use in actions that already have their own wrapper.
 */
export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) {
    throw new AuthError("User session invalid or expired");
  }

  return user;
}

/**
 * Gets current user ID, throws if not authenticated.
 * Shorthand for getAuthenticatedUser().id
 */
export async function getUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user.id;
}

/**
 * Verifies user owns the resource by checking owner ID.
 * Useful for edit/delete operations.
 */
export function verifyResourceOwnership(
  resourceOwnerId: string | null | undefined,
  currentUserId: string
): void {
  if (!resourceOwnerId || resourceOwnerId !== currentUserId) {
    throw new AuthorizationError("You do not have permission to access this resource");
  }
}

/**
 * Creates a batch auth check for multiple resources.
 * Ensures user owns all resources in a list.
 */
export function verifyBatchOwnership(
  resourceOwnerIds: (string | null | undefined)[],
  currentUserId: string
): void {
  const allOwned = resourceOwnerIds.every((ownerId) => ownerId === currentUserId);

  if (!allOwned) {
    throw new AuthorizationError("You do not have permission to access one or more resources");
  }
}
