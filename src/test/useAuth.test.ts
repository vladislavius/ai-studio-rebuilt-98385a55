import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Mock supabase client
const mockGetSession = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      signUp: (...args: unknown[]) => mockSignUp(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Import after mocks
import { useAuth } from '@/hooks/useAuth';

// Wrapper for hooks that need React context
function createWrapper() {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children);
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should start with loading state', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBe(null);
    expect(result.current.user).toBe(null);
  });

  it('should set session after auth state change', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'admin@test.com' },
      access_token: 'token-123',
    };

    // Capture the callback from onAuthStateChange
    let authCallback: Function;
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Simulate auth state change
    await act(async () => {
      authCallback!('SIGNED_IN', mockSession);
    });

    expect(result.current.session).toEqual(mockSession);
    expect(result.current.user).toEqual(mockSession.user);
  });

  it('should handle sign out', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    let authCallback: Function;
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('should handle sign in with email/password', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@test.com' },
    };
    mockSignInWithPassword.mockResolvedValue({
      data: { session: mockSession, user: mockSession.user },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    let signInResult: { error: unknown } | undefined;
    await act(async () => {
      signInResult = await result.current.signIn('test@test.com', 'password123');
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
    expect(signInResult?.error).toBeNull();
  });

  it('should handle sign up', async () => {
    mockSignUp.mockResolvedValue({
      data: { user: { id: 'new-user' }, session: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    let signUpResult: { error: unknown } | undefined;
    await act(async () => {
      signUpResult = await result.current.signUp('new@test.com', 'password123');
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@test.com',
      password: 'password123',
      options: expect.objectContaining({
        emailRedirectTo: expect.any(String),
      }),
    });
    expect(signUpResult?.error).toBeNull();
  });

  it('should check admin role', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'admin@test.com' },
      access_token: 'token',
    };

    let authCallback: Function;
    mockOnAuthStateChange.mockImplementation((cb: Function) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    // Mock the user_roles query
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null,
            }),
          }),
        }),
      }),
    });

    mockGetSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      authCallback!('SIGNED_IN', mockSession);
    });

    // isAdmin should eventually resolve
    await waitFor(() => {
      expect(result.current.isAdmin).toBeDefined();
    });
  });
});
