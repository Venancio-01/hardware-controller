// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { render, screen } from '@testing-library/react';
import { Route } from './login';

expect.extend(matchers);

// Extract component from Route for testing
const LoginPage = Route.options.component as React.ComponentType;

// Mock useAuth
vi.mock('../contexts/auth.context', () => ({
  useAuth: () => ({
    login: vi.fn(),
    isLoading: false,
  }),
}));

describe('LoginPage', () => {
  it('should render login form with username and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });
});
