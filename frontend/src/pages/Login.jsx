import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginForm from '../components/forms/LoginForm';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Alert } from '../components/ui/alert';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, verify2FA, isAuthenticated, loading, error, requires2FA, clearError } = useAuth();
  
  const [loginStep, setLoginStep] = useState('login'); // 'login' or '2fa'
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle login form submission
  const handleLogin = async (credentials) => {
    try {
      clearError();
      const result = await login(credentials);
      
      if (result.requires2FA) {
        setTempUserData(result.user);
        setLoginStep('2fa');
      } else if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login error:', error);
    }
  };

  // Handle 2FA verification
  const handle2FAVerification = async (e) => {
    e.preventDefault();
    
    if (!twoFactorCode.trim()) {
      setTwoFactorError('Código de verificação é obrigatório');
      return;
    }

    try {
      setTwoFactorError('');
      const result = await verify2FA(twoFactorCode);
      
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      setTwoFactorError(error.response?.data?.message || 'Código inválido');
    }
  };

  // Handle resend 2FA code
  const handleResend2FA = async () => {
    if (tempUserData) {
      try {
        // In a real app, this would call an API to resend the code
        console.log('Reenviando código 2FA para:', tempUserData.cpf);
        // Show success message
        setTwoFactorError('');
        // You could show a success toast here
      } catch (error) {
        setTwoFactorError('Erro ao reenviar código');
      }
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setLoginStep('login');
    setTwoFactorCode('');
    setTwoFactorError('');
    setTempUserData(null);
    clearError();
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  if (loading && !requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {loginStep === 'login' ? 'Entrar' : 'Verificação 2FA'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600" data-cy="portal-title">
            Portal de Exames CTC
          </p>
          {loginStep === '2fa' && tempUserData && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Insira o código 2FA enviado para {tempUserData.nome}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {loginStep === 'login' ? (
            <LoginForm
              onLogin={handleLogin}
              onForgotPassword={handleForgotPassword}
              loading={loading}
              error={error}
            />
          ) : (
            <form onSubmit={handle2FAVerification} className="space-y-4">
              {twoFactorError && (
                <Alert role="alert" className="border-red-200 bg-red-50" data-cy="error-alert">
                  <div className="text-red-800">
                    {twoFactorError}
                  </div>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Código de Verificação</Label>
                <Input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Digite o código de 6 dígitos"
                  maxLength={6}
                  aria-required="true"
                  className="text-center tracking-widest"
                  data-cy="2fa-input"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading} data-cy="verify-button">
                {loading ? 'Verificando...' : 'Verificar'}
              </Button>

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-blue-600 hover:text-blue-800 underline"
                  data-cy="back-to-login"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleResend2FA}
                  className="text-blue-600 hover:text-blue-800 underline"
                  data-cy="resend-code"
                >
                  Reenviar código
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}