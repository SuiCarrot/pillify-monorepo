import type { ClockPort } from '../ports/clock';

export class FakeClock implements ClockPort {
  private current: Date;
  private zone: string;

  constructor(initial: Date, timeZone = 'UTC') {
    this.current = new Date(initial.getTime());
    this.zone = timeZone;
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  timeZone(): string {
    return this.zone;
  }

  set(date: Date): void {
    this.current = new Date(date.getTime());
  }

  setTimeZone(timeZone: string): void {
    this.zone = timeZone;
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime());
    this.current.setMinutes(this.current.getMinutes() + minutes);
  }

  advanceDays(days: number): void {
    this.current = new Date(this.current.getTime());
    this.current.setDate(this.current.getDate() + days);
  }
}
