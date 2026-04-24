import { useState, useEffect } from 'react';
import type { User, AuthEvent } from '@inwealthment/shared';

type View = 'login' | 'signup' | 'forgot' | 'update-password';

interface Props {
  onAuthenticated: (user: User) => void;
  authEvent: AuthEvent | null;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: string | null }>;
  resetPassword: (email: string, redirectTo: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const s = {
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    background: 'var(--bg)',
    padding: '24px',
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: '400px',
    background: 'var(--surface)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  } as React.CSSProperties,
  title: {
    color: 'var(--text-primary)',
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '12px 14px',
    color: 'var(--text-primary)',
    fontSize: '16px',
    outline: 'none',
  } as React.CSSProperties,
  button: {
    width: '100%',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '13px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  error: {
    color: '#ff4d6a',
    fontSize: '14px',
  } as React.CSSProperties,
  success: {
    color: '#4ade80',
    fontSize: '14px',
  } as React.CSSProperties,
  link: {
    color: 'var(--accent)',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'center' as const,
    background: 'none',
    border: 'none',
    padding: 0,
  } as React.CSSProperties,
  divider: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '4px',
  } as React.CSSProperties,
};

export function AuthScreen({ onAuthenticated, authEvent, signUp, signIn, resetPassword, updatePassword }: Props) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authEvent === 'PASSWORD_RECOVERY') {
      setView('update-password');
    }
  }, [authEvent]);

  function reset() {
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
  }

  function switchView(v: View) {
    reset();
    setView(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (view === 'login') {
        const { user, error: err } = await signIn(email, password);
        if (err) { setError(err); return; }
        if (user) onAuthenticated(user);
      } else if (view === 'signup') {
        const { error: err } = await signUp(email, password);
        if (err) { setError(err); return; }
        setSuccess('Check your email to confirm your account.');
      } else if (view === 'forgot') {
        const { error: err } = await resetPassword(email, window.location.origin);
        if (err) { setError(err); return; }
        setSuccess('Password reset link sent! Check your email.');
      } else if (view === 'update-password') {
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        const { error: err } = await updatePassword(password);
        if (err) { setError(err); return; }
        setSuccess('Password updated successfully!');
        // onAuthenticated will be called once auth state updates via the adapter
      }
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<View, string> = {
    login: 'Sign In',
    signup: 'Create Account',
    forgot: 'Reset Password',
    'update-password': 'Set New Password',
  };

  return (
    <div style={s.wrapper}>
      <form style={s.card} onSubmit={handleSubmit}>
        <div>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤑🚀</div>
          <h1 style={s.title}>{titles[view]}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Inwealthment</p>
        </div>

        {view !== 'update-password' && (
          <input
            style={s.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        )}

        {(view === 'login' || view === 'signup' || view === 'update-password') && (
          <input
            style={s.input}
            type="password"
            placeholder={view === 'update-password' ? 'New password' : 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={view === 'login' ? 'current-password' : 'new-password'}
          />
        )}

        {(view === 'signup' || view === 'update-password') && (
          <input
            style={s.input}
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        )}

        {error && <p style={s.error}>{error}</p>}
        {success && <p style={s.success}>{success}</p>}

        <button
          type="submit"
          style={{ ...s.button, ...(loading ? s.buttonDisabled : {}) }}
          disabled={loading}
        >
          {loading ? 'Please wait…' : titles[view]}
        </button>

        <div style={s.divider}>
          {view === 'login' && (
            <>
              <button type="button" style={s.link} onClick={() => switchView('signup')}>
                Don't have an account? Sign up
              </button>
              <button type="button" style={s.link} onClick={() => switchView('forgot')}>
                Forgot password?
              </button>
            </>
          )}
          {view === 'signup' && (
            <button type="button" style={s.link} onClick={() => switchView('login')}>
              Already have an account? Sign in
            </button>
          )}
          {view === 'forgot' && (
            <button type="button" style={s.link} onClick={() => switchView('login')}>
              Back to sign in
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
