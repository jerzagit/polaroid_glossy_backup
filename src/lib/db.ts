// Stub — Prisma is not available in serverless deployments.
// All API routes using db have try/catch fallbacks that serve
// static data from JSON when the database is unreachable.

function stubMethod(): Promise<never> {
  return Promise.reject(new Error('Database not available (serverless mode)'));
}

function makeModel(name: string) {
  return new Proxy({} as Record<string, (...args: unknown[]) => Promise<never>>, {
    get: (_target, _prop) => stubMethod,
  });
}

type ModelStub = {
  findMany: (args?: unknown) => Promise<unknown[]>;
  findUnique: (args: { where: Record<string, unknown> }) => Promise<unknown | null>;
  findFirst: (args?: unknown) => Promise<unknown | null>;
  create: (args: { data: unknown }) => Promise<unknown>;
  update: (args: { where: Record<string, unknown>; data: unknown }) => Promise<unknown>;
  upsert: (args: unknown) => Promise<unknown>;
  delete: (args: { where: Record<string, unknown> }) => Promise<unknown>;
};

function m(name: string) {
  return makeModel(name) as ModelStub;
}

export const db = {
  printSize: m('printSize'),
  productMeta: m('productMeta'),
  review: m('review'),
  user: m('user'),
  order: m('order'),
  orderItem: m('orderItem'),
  orderStatusHistory: m('orderStatusHistory'),
  testimonial: m('testimonial'),
};
