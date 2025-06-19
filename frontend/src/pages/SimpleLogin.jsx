import React from 'react';

export default function SimpleLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Entrar
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600" data-cy="portal-title">
            Portal de Exames CTC
          </p>
        </div>
        
        <form className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                placeholder="000.000.000-00"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                data-cy="cpf-input"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                placeholder="Digite sua senha"
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                data-cy="password-input"
              />
            </div>
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              data-cy="login-button"
            >
              Entrar
            </button>
            
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                data-cy="forgot-password-link"
              >
                Esqueci minha senha
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}