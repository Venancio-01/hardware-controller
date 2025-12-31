import { describe, it, expect } from 'vitest';
import { formatUptime } from '../formatters';

describe('formatUptime', () => {
  it('should return "--" for null', () => {
    expect(formatUptime(null)).toBe('--');
  });

  it('should return "--" for negative values', () => {
    expect(formatUptime(-1000)).toBe('--');
  });

  it('should format seconds correctly', () => {
    expect(formatUptime(0)).toBe('0秒');
    expect(formatUptime(1000)).toBe('1秒');
    expect(formatUptime(30000)).toBe('30秒');
    expect(formatUptime(59000)).toBe('59秒');
  });

  it('should format minutes correctly', () => {
    expect(formatUptime(60000)).toBe('1分钟');
    expect(formatUptime(90000)).toBe('1分钟');
    expect(formatUptime(120000)).toBe('2分钟');
    expect(formatUptime(3540000)).toBe('59分钟'); // 59 minutes
  });

  it('should format hours with minutes correctly', () => {
    expect(formatUptime(3600000)).toBe('1小时 0分钟');
    expect(formatUptime(3660000)).toBe('1小时 1分钟');
    expect(formatUptime(7200000)).toBe('2小时 0分钟');
    expect(formatUptime(7260000)).toBe('2小时 1分钟');
    expect(formatUptime(86340000)).toBe('23小时 59分钟'); // 23h 59m
  });

  it('should format days with hours correctly', () => {
    expect(formatUptime(86400000)).toBe('1天 0小时');
    expect(formatUptime(90000000)).toBe('1天 1小时');
    expect(formatUptime(172800000)).toBe('2天 0小时');
    expect(formatUptime(180000000)).toBe('2天 2小时');
  });

  it('should handle large values', () => {
    // 30 days
    expect(formatUptime(2592000000)).toBe('30天 0小时');
    // 365 days
    expect(formatUptime(31536000000)).toBe('365天 0小时');
  });

  it('should handle edge cases', () => {
    // Just under 1 minute
    expect(formatUptime(59999)).toBe('59秒');
    // Just at 1 minute
    expect(formatUptime(60000)).toBe('1分钟');
    // Just under 1 hour
    expect(formatUptime(3599999)).toBe('59分钟');
    // Just at 1 hour
    expect(formatUptime(3600000)).toBe('1小时 0分钟');
    // Just under 1 day
    expect(formatUptime(86399999)).toBe('23小时 59分钟');
    // Just at 1 day
    expect(formatUptime(86400000)).toBe('1天 0小时');
  });
});
