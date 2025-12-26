import { TCPClient } from './src/tcp/client.js';
import { RelayCommandBuilder, parseActiveReportFrame } from './src/relay/controller.js';
import { createModuleLogger } from './src/logger/index.js';

const log = createModuleLogger('ManualTest');

async function main() {
  const HOST = '192.168.0.18';
  const PORT = 50000;

  log.info(`Initializing TCP Client to ${HOST}:${PORT}...`);

  const client = new TCPClient({
    host: HOST,
    port: PORT,
    framing: false, // Hardware protocol does not use length-prefix framing
    timeout: 5000,
    retries: 0
  });

  client.addMessageListener((data) => {
    try {
      const hex = data.toString('hex').toUpperCase();
      log.info(`Received data: ${hex}`);

      // Try to parse as active report
      // Minimal length check (header + address + ... + checksum)
      if (data.length >= 9 && data[0] === 0xEE && data[1] === 0xFF) {
        try {
          const report = parseActiveReportFrame(data);
          log.info('Parsed Active Report:', report);
        } catch (parseError) {
          log.warn('Failed to parse potential active report:', parseError);
        }
      }
    } catch (err) {
      log.error('Error in message listener:', err);
    }
  });

  try {
    log.info('Connecting...');
    await client.connect();
    log.info('Connected!');

    // Wait a bit to receive any initial status
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Close Channel 1
    log.info('Sending: Close Channel 1');
    const closeCmd = RelayCommandBuilder.close(1);
    await client.sendNoWait(closeCmd);
    log.info(`Sent: ${closeCmd.toString('hex').toUpperCase()}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Open Channel 1
    log.info('Sending: Open Channel 1');
    const openCmd = RelayCommandBuilder.open(1);
    await client.sendNoWait(openCmd);
    log.info(`Sent: ${openCmd.toString('hex').toUpperCase()}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    log.info('Test completed. Disconnecting...');
    await client.disconnect();
    log.info('Disconnected.');

  } catch (error) {
    log.error('Test failed:', error);
    try {
      await client.disconnect();
    } catch (e) { /* ignore */ }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
