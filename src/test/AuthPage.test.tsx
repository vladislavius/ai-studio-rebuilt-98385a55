import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthPage } from '@/pages/AuthPage';

// Simple render test — AuthPage should show login form
describe('AuthPage', () => {
  it('should render login form with email and password fields', () => {
    render(<AuthPage onAuthSuccess={() => {}} />);

    expect(screen.getByPlaceholderText(/email/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/пароль/i)).toBeDefined();
  });

  it('should render login button', () => {
    render(<AuthPage onAuthSuccess={() => {}} />);

    expect(screen.getByRole('button', { name: /войти/i })).toBeDefined();
  });

  it('should have a toggle to switch to registration', () => {
    render(<AuthPage onAuthSuccess={() => {}} />);

    expect(screen.getByText(/регистрация/i)).toBeDefined();
  });
});
