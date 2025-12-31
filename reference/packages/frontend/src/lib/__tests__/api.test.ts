
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from '../api';

describe('apiFetch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        // Mock global fetch
        globalThis.fetch = vi.fn();

        // Reset window location mock
        Object.defineProperty(window, 'location', {
            value: {
                href: 'http://localhost/',
                pathname: '/',
                assign: vi.fn(),
            },
            writable: true
        });
    });

    it('should add Authorization header if token exists', async () => {
        // Arrange
        localStorage.setItem('token', 'test-token');
        (globalThis.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: 'ok' })
        });

        // Act
        await apiFetch('/test');

        // Assert
        expect(globalThis.fetch).toHaveBeenCalled();
        const callArgs = (globalThis.fetch as any).mock.calls[0];
        const headers = callArgs[1].headers as Headers;
        expect(headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should handle 401 response: remove token and redirect', async () => {
        // Arrange
        localStorage.setItem('token', 'expired-token');
        (globalThis.fetch as any).mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        // Use a spy on localStorage
        const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

        // Act & Assert
        await expect(apiFetch('/test')).rejects.toThrow('认证已过期，请重新登录');

        expect(removeItemSpy).toHaveBeenCalledWith('token');
        expect(window.location.href).toBe('/login');
    });

    it('should not redirect if already on login page', async () => {
        // Arrange
        Object.defineProperty(window, 'location', {
            value: {
                href: 'http://localhost/login',
                pathname: '/login',
            },
            writable: true
        });

        localStorage.setItem('token', 'invalid-token');
        (globalThis.fetch as any).mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

        // Act & Assert
        await expect(apiFetch('/test')).rejects.toThrow('认证已过期，请重新登录');

        expect(removeItemSpy).toHaveBeenCalledWith('token');
        expect(window.location.href).toBe('http://localhost/login'); // Should remain unchanged
    });

    it('should return data on success', async () => {
        // Arrange
        const mockData = { id: 1, name: 'test' };
        (globalThis.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: mockData })
        });

        // Act
        const result = await apiFetch('/test');

        // Assert
        expect(result).toEqual(mockData);
    });
});
