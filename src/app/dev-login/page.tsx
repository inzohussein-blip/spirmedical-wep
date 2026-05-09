'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { quickLogin } from './actions';

export default function DevLoginPage() {
  const router = useRouter();
  const [accountNumber, setAccountNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!accountNumber || !accessCode) {
      setError('يرجى إدخال الرقم والرمز');
      setLoading(false);
      return;
    }

    try {
      const result = await quickLogin(accountNumber, accessCode);

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      } else {
        setError(result.error || 'بيانات خاطئة');
        setLoading(false);
      }
    } catch (e) {
      setError('حدث خطأ. حاول مرة أخرى');
      setLoading(false);
    }
  }

  return (
    <div className="dev-login-page">
      <div className="dev-login-container">
        <div className="dev-login-header">
          <div className="dev-login-logo">س</div>
          <h1>Spir Medical</h1>
          <p>دخول سريع بحساب شخصي</p>
        </div>

        <form onSubmit={handleLogin} className="dev-login-form">
          <div className="field">
            <label>رقم الحساب</label>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setError(null);
              }}
              placeholder="مثال: 100001"
              maxLength={10}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="field">
            <label>الرمز السري</label>
            <input
              type="password"
              inputMode="numeric"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setError(null);
              }}
              placeholder="••••••"
              maxLength={20}
              autoComplete="off"
            />
          </div>

          {error && <div className="error-banner">⚠️ {error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'جارٍ الدخول...' : 'دخول مباشر ←'}
          </button>
        </form>

        <div className="back-link">
          <Link href="/">← العودة للرئيسية</Link>
        </div>
      </div>

      <style jsx>{`
        .dev-login-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #F4EFE2 0%, #EDE6D3 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .dev-login-container {
          background: #FFFFFF;
          border-radius: 24px;
          padding: 40px 32px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.15);
        }

        .dev-login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .dev-login-logo {
          width: 72px;
          height: 72px;
          background: #0E5C4D;
          color: #FAF6EB;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 38px;
          font-weight: 900;
          margin-bottom: 14px;
          box-shadow: 0 12px 30px -6px rgba(14, 92, 77, 0.5);
        }

        .dev-login-header h1 {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 6px;
          letter-spacing: -0.02em;
        }

        .dev-login-header p {
          font-size: 13px;
          color: #6E7878;
          margin: 0;
        }

        .dev-login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .field label {
          font-size: 13px;
          font-weight: 700;
          color: #1F2A2C;
        }

        .field input {
          background: #FAF6EB;
          border: 1.5px solid rgba(15, 26, 28, 0.08);
          border-radius: 12px;
          padding: 14px;
          font-size: 15px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          letter-spacing: 0.05em;
          outline: none;
          transition: all 0.2s;
          color: #0F1A1C;
        }

        .field input:focus {
          border-color: #0E5C4D;
          background: #FFFFFF;
          box-shadow: 0 0 0 4px rgba(14, 92, 77, 0.1);
        }

        .error-banner {
          background: #F0D7D8;
          color: #A82E3D;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          text-align: center;
        }

        .login-btn {
          background: #0E5C4D;
          color: #FAF6EB;
          padding: 15px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          border: 0;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 8px 20px -6px rgba(14, 92, 77, 0.5);
          transition: all 0.2s;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -6px rgba(14, 92, 77, 0.6);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .back-link {
          margin-top: 24px;
          text-align: center;
        }

        .back-link a {
          color: #6E7878;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .back-link a:hover {
          color: #0E5C4D;
        }
      `}</style>
    </div>
  );
}
