// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mocking the createFileRoute chain
const mockCreateFileRoute = vi.fn();
// We need to return a function that accepts component/options
const mockRouteBuilder = vi.fn((options) => options);
mockCreateFileRoute.mockReturnValue(mockRouteBuilder);

// Mock redirect
const mockRedirect = vi.fn();

vi.mock('@tanstack/react-router', async () => {
    return {
        createFileRoute: (path: string) => {
            mockCreateFileRoute(path);
            return mockRouteBuilder;
        },
        Outlet: () => 'Outlet',
        redirect: mockRedirect
    };
});

describe('Auth Route Protection', () => {
    let RouteOptions: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        // Reset modules to re-import and re-trigger createFileRoute
        vi.resetModules();

        // We need to re-import the module to capture the definition
        const mod = await import('../_auth');
        // Route export is the result of the chain.
        // In our mock, mockRouteBuilder returns the options object passed to it and assigns it to Route.
        // So mod.Route should be the options object.
        RouteOptions = mod.Route;
    });

    it('should have a beforeLoad function defined', () => {
        expect(RouteOptions.beforeLoad).toBeDefined();
        expect(typeof RouteOptions.beforeLoad).toBe('function');
    });

    it('should redirect to login if no token is present', async () => {
        // Arrange
        const beforeLoad = RouteOptions.beforeLoad;
        if (!beforeLoad) throw new Error('beforeLoad not defined');

        const context = {};
        const location = { href: '/dashboard' };

        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

        // Act & Assert
        try {
            await beforeLoad({ context, location });
            // If it doesn't throw, we check if it should have
            expect(mockRedirect).toHaveBeenCalled();
            // Or if implementation throws the result of redirect()
        } catch (error) {
            // It might throw the redirection object
            expect(mockRedirect).toHaveBeenCalledWith({
                to: '/login',
                search: {
                    redirect: '/dashboard'
                }
            });
        }
    });

    it('should allow access if token is present', async () => {
        // Arrange
        const beforeLoad = RouteOptions.beforeLoad;
        if (!beforeLoad) throw new Error('beforeLoad not defined');

        const context = {};
        const location = { href: '/dashboard' };

        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('valid-token');

        // Act
        await beforeLoad({ context, location });

        // Assert
        expect(mockRedirect).not.toHaveBeenCalled();
    });
});
