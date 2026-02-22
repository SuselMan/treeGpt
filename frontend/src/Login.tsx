import { googleLoginUrl } from './api';

export default function Login() {
  const url = googleLoginUrl();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #0f0f12 0%, #18181b 100%)' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>TreeGPT</h1>
        <p style={{ color: '#71717a', marginBottom: '2rem' }}>Branching conversations with threads</p>
        <a
          href={url}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#fff',
            color: '#18181b',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Sign in with Google
        </a>
        {new URLSearchParams(window.location.search).get('error') === 'auth' && (
          <p style={{ color: '#f87171', marginTop: '1rem' }}>Sign-in failed. Try again.</p>
        )}
      </div>
    </div>
  );
}
