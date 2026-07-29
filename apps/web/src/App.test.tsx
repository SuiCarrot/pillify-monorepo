import { describe, expect, it } from 'vitest';

import { AppRoutes } from './routes';

describe('@pillify/web routes', () => {
  it('exports the app route tree', () => {
    expect(typeof AppRoutes).toBe('function');
  });
});
