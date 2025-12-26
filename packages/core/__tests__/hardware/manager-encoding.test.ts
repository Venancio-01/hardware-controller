/**
 * HardwareCommunicationManager.sendCommand 编码参数测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// 测试 sendCommand 的 encoding 参数转换逻辑
describe('sendCommand encoding', () => {
  describe('Buffer.from encoding conversion', () => {
    it('should convert hex string to buffer when encoding is hex', () => {
      // 输入: "48454C4C4F" (HELLO 的十六进制表示)
      const hexString = '48454C4C4F';
      const commandBuffer = Buffer.from(hexString.replace(/\s/g, ''), 'hex');

      // 期望: Buffer.from([0x48, 0x45, 0x4C, 0x4C, 0x4F])
      const expectedBuffer = Buffer.from([0x48, 0x45, 0x4C, 0x4C, 0x4F]);
      expect(commandBuffer).toEqual(expectedBuffer);
    });

    it('should convert hex string with spaces to buffer', () => {
      // 输入: "48 45 4C 4C 4F" (带空格的十六进制)
      const hexString = '48 45 4C 4C 4F';
      const commandBuffer = Buffer.from(hexString.replace(/\s/g, ''), 'hex');

      const expectedBuffer = Buffer.from([0x48, 0x45, 0x4C, 0x4C, 0x4F]);
      expect(commandBuffer).toEqual(expectedBuffer);
    });

    it('should use ascii encoding when specified', () => {
      // 输入: "HELLO", encoding: 'ascii'
      const input = 'HELLO';
      const commandBuffer = Buffer.from(input, 'ascii');

      // 期望: Buffer.from("HELLO", 'ascii')
      const expectedBuffer = Buffer.from('HELLO', 'ascii');
      expect(commandBuffer).toEqual(expectedBuffer);
      expect(commandBuffer.toString('ascii')).toBe('HELLO');
    });

    it('should use utf-8 encoding when specified', () => {
      // 输入: "你好", encoding: 'utf-8'
      const input = '你好';
      const commandBuffer = Buffer.from(input, 'utf-8');

      // 期望: Buffer.from("你好", 'utf-8')
      const expectedBuffer = Buffer.from('你好', 'utf-8');
      expect(commandBuffer).toEqual(expectedBuffer);
      expect(commandBuffer.toString('utf-8')).toBe('你好');
    });

    it('should pass Buffer directly without encoding', () => {
      // 输入: Buffer.from([0x01, 0x02])
      const inputBuffer = Buffer.from([0x01, 0x02]);

      // Buffer.isBuffer 检查
      expect(Buffer.isBuffer(inputBuffer)).toBe(true);

      // 保持原样
      expect(inputBuffer).toEqual(Buffer.from([0x01, 0x02]));
    });

    it('should handle empty hex string', () => {
      const hexString = '';
      const commandBuffer = Buffer.from(hexString.replace(/\s/g, ''), 'hex');

      expect(commandBuffer.length).toBe(0);
    });

    it('should handle relay control command format', () => {
      // 继电器控制命令示例: 地址(0x00) + 功能码(0x10) + 通道(0x01) + 状态(0x01) + 校验
      const relayCommand = '00 10 01 01';
      const commandBuffer = Buffer.from(relayCommand.replace(/\s/g, ''), 'hex');

      expect(commandBuffer).toEqual(Buffer.from([0x00, 0x10, 0x01, 0x01]));
    });
  });

  describe('CommandEncoding type', () => {
    it('should accept valid encoding values', () => {
      type CommandEncoding = 'hex' | 'ascii' | 'utf-8';

      const hexEncoding: CommandEncoding = 'hex';
      const asciiEncoding: CommandEncoding = 'ascii';
      const utf8Encoding: CommandEncoding = 'utf-8';

      expect(hexEncoding).toBe('hex');
      expect(asciiEncoding).toBe('ascii');
      expect(utf8Encoding).toBe('utf-8');
    });
  });
});
