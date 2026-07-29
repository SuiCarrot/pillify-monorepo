import { describe, expect, it } from 'vitest';

import { DevNotificationAdapter } from './DevNotificationAdapter';

describe('DevNotificationAdapter', () => {
  it('exposes the unreliable flag for the UI banner', () => {
    const adapter = new DevNotificationAdapter();
    expect(adapter.isReliable).toBe(false);
  });

  it('reports a known permission state', () => {
    const adapter = new DevNotificationAdapter();
    expect(['granted', 'denied', 'prompt']).toContain(adapter.getPermissionState());
  });

  it('replaces the pending set on schedule and supports cancel', async () => {
    const adapter = new DevNotificationAdapter();
    const fireAt = new Date(Date.now() + 60_000).toISOString();

    await adapter.schedule([
      {
        id: 'dose-a#0',
        medicationId: 'med-1',
        doseId: 'dose-a',
        attempt: 0,
        fireAt,
        title: 'A',
        body: 'body',
      },
      {
        id: 'dose-b#0',
        medicationId: 'med-1',
        doseId: 'dose-b',
        attempt: 0,
        fireAt,
        title: 'B',
        body: 'body',
      },
    ]);

    expect(await adapter.listPending()).toEqual(['dose-a#0', 'dose-b#0']);

    await adapter.cancel(['dose-a#0']);
    expect(await adapter.listPending()).toEqual(['dose-b#0']);

    await adapter.schedule([
      {
        id: 'dose-c#0',
        medicationId: 'med-1',
        doseId: 'dose-c',
        attempt: 0,
        fireAt,
        title: 'C',
        body: 'body',
      },
    ]);
    expect(await adapter.listPending()).toEqual(['dose-c#0']);
  });
});
