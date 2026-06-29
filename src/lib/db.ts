// Stub — Prisma is not available in Vercel deployments.
// All API routes using db have try/catch fallbacks that serve
// static data from JSON when the database is unreachable.

function stubMethod(): Promise<never> {
  return Promise.reject(new Error('Database not available (Vercel mode)'));
}

function makeModel(name: string) {
  return new Proxy({} as Record<string, (...args: unknown[]) => Promise<never>>, {
    get: (_target, _prop) => stubMethod,
  });
}

export const db = {
  printSize: makeModel('printSize') as {
    findMany: (args?: unknown) => Promise<unknown[]>;
    findUnique: (args: { where: { id: string } }) => Promise<unknown | null>;
    create: (args: { data: unknown }) => Promise<unknown>;
  },
  productMeta: makeModel('productMeta') as {
    findMany: (args?: unknown) => Promise<unknown[]>;
    create: (args: { data: unknown }) => Promise<unknown>;
    upsert: (args: unknown) => Promise<unknown>;
  },
};
