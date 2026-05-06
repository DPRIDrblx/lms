import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === "your-supabase-project-url") {
    // Return a proxy that throws helpful errors when methods are called
    // This prevents crashes during build/prerender
    const handler: ProxyHandler<object> = {
      get: (_target, prop) => {
        if (prop === "auth") {
          return new Proxy({}, {
            get: () => () => Promise.resolve({ data: { session: null, user: null }, error: null }),
          });
        }
        if (prop === "from") {
          return () => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }), then: (fn: (v: { data: null }) => void) => fn({ data: null }) }), order: () => ({ limit: () => ({ then: (fn: (v: { data: null }) => void) => fn({ data: null }) }), then: (fn: (v: { data: null }) => void) => fn({ data: null }) }), then: (fn: (v: { data: null }) => void) => fn({ data: null }) }),
            insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }), then: (fn: (v: { data: null; error: null }) => void) => fn({ data: null, error: null }) }),
            update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
            upsert: () => Promise.resolve({ data: null, error: null }),
            delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
          });
        }
        if (prop === "channel") {
          return () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) });
        }
        if (prop === "removeChannel") {
          return () => {};
        }
        return () => {};
      },
    };
    return new Proxy({}, handler) as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(url, key);
}
