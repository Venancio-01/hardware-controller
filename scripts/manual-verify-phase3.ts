import { spawn } from 'child_process';
import { HardwareCommunicationManager } from '../src/hardware/manager.js';

console.log('--- Phase 3 Verification: System Orchestration ---');
console.log('Starting app in a subprocess to verify it starts and polls...');

const child = spawn('bun', ['run', 'src/index.ts'], {
  env: { 
    ...process.env, 
    NODE_ENV: 'test', 
    LOG_LEVEL: 'debug',
    VOICE_BROADCAST_CABINET_HOST: '', 
    VOICE_BROADCAST_CONTROL_HOST: '',
    QUERY_INTERVAL: '100'
  }
});

child.stdout.on('data', (data) => {
  const msg = data.toString();
  process.stdout.write(msg);
  
  if (msg.includes('开始 UDP 查询循环')) {
    console.log('\n[SUCCESS] App started and reached polling loop.');
    child.kill('SIGINT');
  }
});

child.stderr.on('data', (data) => {
  console.error(`[App Error] ${data}`);
});

child.on('close', (code) => {
  console.log(`\nApp exited with code ${code}`);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('\n[TIMEOUT] App did not start polling loop within 10s');
  child.kill();
  process.exit(1);
}, 10000);
