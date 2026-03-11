import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GradientDots } from '@/components/ui/gradient-dots';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const { signIn, signUp } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Проверьте почту для подтверждения регистрации');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onAuthSuccess();
        }
      }
    } catch (err) {
      setError('Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <GradientDots dotSize={3} spacing={18} duration={40} colorCycleDuration={10} className="fixed opacity-[0.08] pointer-events-none z-0" />
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-2xl flex items-center justify-center mx-auto mb-4">
            ОС
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Остров Сокровищ</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">HR-система управления персоналом</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-foreground text-center">
            {isRegistering ? 'Регистрация' : 'Вход в систему'}
          </h2>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 font-body">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-primary/10 border border-primary/20 text-primary text-sm rounded-lg p-3 font-body">
              {success}
            </div>
          )}

          <div>
            <label className="block text-xs font-display font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
            />
          </div>

          <div>
            <label className="block text-xs font-display font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Пароль"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-body"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-display font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm"
          >
            {loading ? 'Загрузка...' : isRegistering ? 'Зарегистрироваться' : 'Войти'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccess('');
              }}
              className="text-sm text-secondary hover:text-secondary/80 font-body transition-colors"
            >
              {isRegistering ? 'Уже есть аккаунт? Войти' : 'Регистрация'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
