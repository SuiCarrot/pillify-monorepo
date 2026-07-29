export interface ClockPort {
  now(): Date;
  timeZone(): string;
}
