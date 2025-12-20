import { EventEmitter } from 'events';
import type { Socket } from 'node:net';

export class MockTCPSocket extends EventEmitter {
    public sentData: Buffer[] = [];
    public destroyed: boolean = false;
    public remoteAddress?: string = '127.0.0.1';
    public remotePort?: number = 8888;
    
    public _timeout?: number;
    public _keepAlive?: boolean;
    public _noDelay?: boolean;

    constructor() {
        super();
    }

    // While net.connect returns a socket, sometimes that socket is not yet connected.
    // In TCPClient, it does:
    // this.socket = connect(port, host);
    // this.socket.on('connect', ...)
    // So we should probably emit 'connect' shortly after creation if we want to simulate successful connection,
    // or let the test control it.
    
    write(buffer: Uint8Array | string, cb?: (err?: Error) => void): boolean {
        if (this.destroyed) {
            const err = new Error('Socket is destroyed');
            if (cb) cb(err);
            else this.emit('error', err);
            return false;
        }
        
        this.sentData.push(Buffer.from(buffer));
        process.nextTick(() => {
            if (cb) cb();
        });
        return true;
    }

    end(cb?: () => void): this {
        this.destroyed = true;
        process.nextTick(() => {
            this.emit('close');
            if (cb) cb();
        });
        return this;
    }

    destroy(error?: Error): this {
        this.destroyed = true;
        if (error) {
            this.emit('error', error);
        }
        // Often 'close' is emitted after error/destroy
        this.emit('close');
        return this;
    }

    setTimeout(timeout: number, callback?: () => void): this {
        this._timeout = timeout;
        if (callback) {
            this.on('timeout', callback);
        }
        return this;
    }

    setKeepAlive(enable?: boolean, initialDelay?: number): this {
        this._keepAlive = enable;
        return this;
    }

    setNoDelay(noDelay?: boolean): this {
        this._noDelay = noDelay;
        return this;
    }
    
    // Test Helpers
    simulateConnect() {
        this.emit('connect');
    }

    simulateData(data: Buffer) {
        this.emit('data', data);
    }
    
    simulateError(err: Error) {
        this.emit('error', err);
    }

    simulateClose() {
        this.emit('close');
    }
    
    simulateTimeout() {
        this.emit('timeout');
    }
}
