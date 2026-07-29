import type { ClockPort } from '@pillify/core';

export class SystemClock implements ClockPort {
  now(): Date {
    return new Date();
  }

  timeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}
