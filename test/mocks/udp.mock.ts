import { EventEmitter } from 'events';
import type { Socket, RemoteInfo } from 'node:dgram';

export class MockUDPSocket extends EventEmitter {
  public sentMessages: Array<{ msg: Buffer, port: number, address: string }> = [];
  public boundPort: number | null = null;
  public _address: { address: string; family: string; port: number } = { address: '127.0.0.1', family: 'IPv4', port: 0 };
  public isClosed = false;

  bind(port?: number, address?: string, callback?: () => void): this {
    this.boundPort = port || 0;
    this._address.port = this.boundPort;
    
    // Allow address to be the callback if port is omitted or address is omitted
    if (typeof address === 'function') {
        callback = address;
        address = undefined;
    }

    process.nextTick(() => {
        this.emit('listening');
        if (callback) callback();
    });
    return this;
  }

  send(
    msg: Buffer | string | Uint8Array | any[],
    port: number,
    address: string,
    callback?: (error: Error | null, bytes: number) => void
  ): void {
      if (this.isClosed) {
          const err = new Error('Socket is closed');
          if (callback) callback(err, 0);
          else this.emit('error', err);
          return;
      }

      this.sentMessages.push({
          msg: Buffer.from(msg as any),
          port: port,
          address: address,
      });

      process.nextTick(() => {
          if (callback) callback(null, (msg as any).length);
      });
  }

  close(callback?: () => void): this {
      this.isClosed = true;
      process.nextTick(() => {
          this.emit('close');
          if (callback) callback();
      });
      return this;
  }

  address(): { address: string; family: string; port: number } {
      return this._address;
  }
  
  // Test helpers
  simulateMessage(msg: Buffer, rinfo: RemoteInfo) {
      this.emit('message', msg, rinfo);
  }
  
  simulateError(err: Error) {
      this.emit('error', err);
  }
}
