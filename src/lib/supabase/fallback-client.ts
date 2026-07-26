type SupabaseError = { message: string };

function createFallbackError(message: string): SupabaseError {
  return { message };
}

function createFallbackQueryBuilder() {
  const builder = {
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    gte() {
      return builder;
    },
    lte() {
      return builder;
    },
    order() {
      return builder;
    },
    range() {
      return builder;
    },
    single: async () => ({ data: null, error: createFallbackError("Supabase is not configured") }),
    maybeSingle: async () => ({ data: null, error: createFallbackError("Supabase is not configured") }),
    insert: async () => ({ data: null, error: createFallbackError("Supabase is not configured") }),
    update: async () => ({ data: null, error: createFallbackError("Supabase is not configured") }),
    delete: async () => ({ data: null, error: createFallbackError("Supabase is not configured") }),
    then(resolve: (value: { data: null; error: SupabaseError }) => unknown) {
      return Promise.resolve({ data: null, error: createFallbackError("Supabase is not configured") }).then(resolve);
    },
    catch(reject: (reason: SupabaseError) => unknown) {
      return Promise.resolve({ data: null, error: createFallbackError("Supabase is not configured") }).catch(reject);
    },
  };

  return builder;
}

export function createFallbackClient() {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null },
        error: createFallbackError("Supabase is not configured. Please add your environment variables."),
      }),
      signUp: async () => ({
        data: { user: null },
        error: createFallbackError("Supabase is not configured. Please add your environment variables."),
      }),
      signOut: async () => ({ error: null }),
    },
    from() {
      return createFallbackQueryBuilder();
    },
  };
}

export function hasSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      key &&
      !url.includes("your_supabase_project_url") &&
      !key.includes("your_supabase_anon_key")
  );
}
