// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route } from './login';

expect.extend(matchers);

// Extract component from Route for testing
const LoginPage = Route.options.component as React.ComponentType;

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('../contexts/auth.context', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  it('should render login form with username and password fields', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    // Submit without filling fields
    const submitButton = screen.getByRole('button', { name: /登录/i });
    await user.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/用户名不能为空/i)).toBeInTheDocument();
      expect(screen.getByText(/密码不能为空/i)).toBeInTheDocument();
    });
  });

  it('should call login with credentials on form submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ success: true, token: 'test-token' });
    render(<LoginPage />);

    // Fill in the form
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /登录/i });
    await user.click(submitButton);

    // Verify login was called
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'admin',
        password: 'password123',
      });
    });
  });

  it('should display error message on login failure', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(new Error('用户名或密码错误'));
    render(<LoginPage />);

    // Fill in the form
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    await user.type(usernameInput, 'wrong');
    await user.type(passwordInput, 'wrong');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /登录/i });
    await user.click(submitButton);

    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(/登录失败/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    // Create a promise that we can resolve later
    let resolveLogin: any;
    mockLogin.mockImplementation(() => new Promise(resolve => { resolveLogin = resolve; }));

    render(<LoginPage />);

    // Fill in the form
    const usernameInput = screen.getByLabelText(/用户名/i);
    const passwordInput = screen.getByLabelText(/密码/i);
    await user.type(usernameInput, 'admin');
    await user.type(passwordInput, 'password123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /登录/i });
    await user.click(submitButton);

    // Check loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /登录中.../i })).toBeInTheDocument();
    });

    // Resolve the login
    resolveLogin({ success: true, token: 'test-token' });
  });
});
