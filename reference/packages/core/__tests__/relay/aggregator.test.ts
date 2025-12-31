import { describe, it, expect, beforeEach } from 'vitest';
import { RelayStatusAggregator, type RelayClientId } from '../../src/business-logic/relay-status-aggregator.js';

describe('RelayStatusAggregator - Index Matching Bug Repro', () => {
  let aggregator: RelayStatusAggregator;

  beforeEach(() => {
    aggregator = new RelayStatusAggregator();
  });

  it('should reproduce the bug where CH13 matches CH1 string check', () => {
    // 1. Initial state (all open/false)
    const initialStatus = {
      channels: Array(8).fill(false),
      rawHex: 'EE FF C0 01 00 00 00 00 00'
    };
    aggregator.update('cabinet', initialStatus);
    aggregator.update('control', initialStatus);

    // 2. Trigger CH13 change (Index 12 in combined state: 8 cabinet + 5th of control)
    // Control channels are Index 8 to 15 in combinedState
    // CH13 is Index 12
    const controlStatusCH13 = {
      channels: [false, false, false, false, true, false, false, false], // Index 4 of control = CH13
      rawHex: 'EE FF C0 01 00 08 00 00 00'
    };

    const update = aggregator.update('control', controlStatusCH13);

    expect(update).not.toBeNull();
    if (update) {
      expect(update.changed).toBe(true);
      expect(update.changeDescriptions).toContain('CH13: 断开 → 闭合');

      // THE BUG: 'CH13' includes 'CH1'
      const matchesCH1 = update.changeDescriptions.some(d => d.includes('CH1'));
      expect(matchesCH1).toBe(true); // This confirms the bug exists in current logic
    }
  });

  it('should correctly distinguish CH1 and CH13 using hasIndexChanged', () => {
    // Initial state
    aggregator.update('cabinet', { channels: Array(8).fill(false), rawHex: 'EE FF C0 01 00 00 00 00 00' });
    aggregator.update('control', { channels: Array(8).fill(false), rawHex: 'EE FF C0 01 00 00 00 00 00' });

    // Change CH13 (Index 12)
    const update = aggregator.update('control', { 
      channels: [false, false, false, false, true, false, false, false], 
      rawHex: 'EE FF C0 01 00 08 00 00 00' 
    });

    expect(update).not.toBeNull();
    if (update) {
      expect(aggregator.hasIndexChanged(12, update)).toBe(true);  // CH13 changed
      expect(aggregator.hasIndexChanged(0, update)).toBe(false); // CH1 should NOT have changed
    }
  });

  it('should handle boundary conditions for hasIndexChanged', () => {
    aggregator.update('cabinet', { channels: Array(8).fill(false), rawHex: 'EE FF C0 01 00 00 00 00 00' });
    aggregator.update('control', { channels: Array(8).fill(false), rawHex: 'EE FF C0 01 00 00 00 00 00' });

    const update = aggregator.update('control', { 
      channels: [true, true, true, true, true, true, true, true], 
      rawHex: 'EE FF C0 01 00 FF 00 00 00' 
    });

    if (update) {
      expect(aggregator.hasIndexChanged(-1, update)).toBe(false);
      expect(aggregator.hasIndexChanged(16, update)).toBe(false);
      expect(aggregator.hasIndexChanged(0, update)).toBe(false); // CH1 (cabinet) still false
      expect(aggregator.hasIndexChanged(8, update)).toBe(true);  // CH9 (control start) changed to true
      expect(aggregator.hasIndexChanged(15, update)).toBe(true); // CH16 changed to true
    }
  });

  it('should return false if previousCombined is null', () => {
    // We need both to get the first update
    aggregator.update('control', { channels: Array(8).fill(false), rawHex: 'EE FF C0 01 00 00 00 00 00' });
    const update = aggregator.update('cabinet', { channels: Array(8).fill(false), rawHex: 'EE FF C0 01 00 00 00 00 00' });
    
    // First update has no previousCombined
    expect(update).not.toBeNull();
    if (update) {
      expect(update.previousCombined).toBeNull();
      expect(aggregator.hasIndexChanged(0, update)).toBe(false);
    }
  });
});
