import { describe, expect, it } from 'vitest';
import { RelayCommandBuilder, parseActiveReportFrame } from '../../src/relay/controller.js';

describe('RelayCommandBuilder', () => {
  it('builds A1 close frame for channel 2', () => {
    const frame = RelayCommandBuilder.close(2);
    const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0x02, 0x00, 0x02, 0xA6, 0x4C]);
    expect(frame.equals(expected)).toBe(true);
  });

  it('builds A1 open frame for channel 2', () => {
    const frame = RelayCommandBuilder.open(2);
    const expected = Buffer.from([0xCC, 0xDD, 0xA1, 0x01, 0x00, 0x00, 0x00, 0x02, 0xA4, 0x48]);
    expect(frame.equals(expected)).toBe(true);
  });
});

describe('parseActiveReportFrame', () => {
  it('parses relay/input states and edges from active report frame', () => {
    const frame = Buffer.from([0xEE, 0xFF, 0xC0, 0x01, 0x00, 0x11, 0x01, 0x00, 0xD3]);
    const report = parseActiveReportFrame(frame);

    expect(report.rawHex).toBe('EE FF C0 01 00 11 01 00 D3');
    expect(report.relayState).toEqual([false, false, false, false, false, false, false, false]);
    expect(report.inputState[0]).toBe(true);
    expect(report.inputState[4]).toBe(true);
    expect(report.inputState[1]).toBe(false);
    expect(report.risingEdge).toEqual([0]);
    expect(report.fallingEdge).toEqual([]);
  });
});
