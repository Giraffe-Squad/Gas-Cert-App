import { useState } from 'react';
import { COLORS, loadFromStorage, DEFAULT_USERNAME, DEFAULT_PASSWORD } from './data';
import { Shield, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * GasSafeLogo — SVG recreation, resolution independent
 */
export function GasSafeLogo({ size = 44 }) {
  const scale = size / 120;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ borderRadius: 8 * scale, flexShrink: 0 }}>
      <defs>
        <linearGradient id="yellowGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFD000" />
          <stop offset="100%" stopColor="#FFE54C" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="12" fill="#1a1a1a" />
      <polygon points="8,112 112,112 112,8" fill="url(#yellowGrad)" />
      <text x="40" y="60" fontFamily="Arial,Helvetica,sans-serif" fontSize="22" fontWeight="900" fill="#1a1a1a" letterSpacing="-0.5">GAS</text>
      <text x="28" y="88" fontFamily="Arial,Helvetica,sans-serif" fontSize="30" fontWeight="900" fill="#1a1a1a" letterSpacing="-1">safe</text>
      <text x="93" y="76" fontFamily="Arial,sans-serif" fontSize="8" fill="#1a1a1a" fontWeight="700">™</text>
      <rect x="8" y="98" width="104" height="16" rx="2" fill="#1a1a1a" />
      <text x="60" y="110" fontFamily="Arial,Helvetica,sans-serif" fontSize="11" fontWeight="700" fill="#FFD000" textAnchor="middle" letterSpacing="3.5">REGISTER</text>
    </svg>
  );
}

/**
 * LoginPage — beautiful login screen
 */
export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Load stored credentials or use defaults
    const storedUsername = loadFromStorage('cp12_username', DEFAULT_USERNAME);
    const storedPassword = loadFromStorage('cp12_password', DEFAULT_PASSWORD);

    if (username.toLowerCase() === storedUsername.toLowerCase() && password === storedPassword) {
      onLogin();
    } else {
      setError('Invalid username or password');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div style={loginStyles.root}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>

      {/* Animated background */}
      <div style={loginStyles.bgGradient} />
      <div style={loginStyles.bgPattern} />

      {/* Login card */}
      <div style={{
        ...loginStyles.card,
        animation: shaking ? 'shake 0.4s ease' : 'fadeInUp 0.6s ease',
      }}>
        {/* Logo and header */}
        <div style={loginStyles.logoSection}>
          <div style={{ animation: 'float 3s ease-in-out infinite' }}>
            <GasSafeLogo size={72} />
          </div>
          <h1 style={loginStyles.title}>Gas Safety Certificates</h1>
          <p style={loginStyles.subtitle}>CP12 — Landlord Gas Safety Records</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={loginStyles.form}>
          <div style={loginStyles.fieldGroup}>
            <label style={loginStyles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Enter your username"
              style={loginStyles.input}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div style={loginStyles.fieldGroup}>
            <label style={loginStyles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter your password"
                style={loginStyles.input}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={loginStyles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={loginStyles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" style={loginStyles.submitButton}>
            <LogIn size={18} />
            Sign In
          </button>
        </form>

        <p style={loginStyles.footer}>
          Secured access · Gas Safe Register
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN STYLES
   ═══════════════════════════════════════════════════════════════ */
const loginStyles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Outfit', sans-serif",
    padding: 20,
  },
  bgGradient: {
    position: 'fixed',
    inset: 0,
    background: 'linear-gradient(135deg, #0c1f3f 0%, #1a3a6b 30%, #0d2847 60%, #091c35 100%)',
    backgroundSize: '400% 400%',
    animation: 'gradientShift 15s ease infinite',
  },
  bgPattern: {
    position: 'fixed',
    inset: 0,
    backgroundImage: `radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)`,
    backgroundSize: '28px 28px',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: '#ffffff',
    borderRadius: 24,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 24px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: COLORS.primary,
    marginTop: 16,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1.5px solid ${COLORS.border}`,
    background: COLORS.inputBg,
    fontSize: 15,
    color: COLORS.text,
    fontFamily: "'Outfit', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: COLORS.muted,
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 10,
    background: COLORS.redBg,
    border: `1px solid ${COLORS.red}30`,
    color: COLORS.red,
    fontSize: 13,
    fontWeight: 500,
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 24px',
    borderRadius: 12,
    background: COLORS.primary,
    border: 'none',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.2s',
    marginTop: 6,
    boxShadow: '0 4px 14px rgba(12,31,63,0.3)',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 24,
    letterSpacing: 0.5,
  },
};
