import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert } from '../ui/alert';
import { Eye, EyeOff } from 'lucide-react';

// CPF formatting function
const formatCPF = (value) => {
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// CPF validation
const validateCPF = (cpf) => {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  // Check for invalid patterns like 111.111.111-11
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return 'CPF inválido';
  }
  
  return null;
};

export default function LoginForm({ 
  onLogin, 
  onForgotPassword, 
  loading = false, 
  error = null, 
  errorCode = null 
}) {
  const [formData, setFormData] = useState({
    cpf: '',
    senha: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Format CPF
    if (name === 'cpf') {
      processedValue = formatCPF(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // CPF validation
    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else {
      const cpfError = validateCPF(formData.cpf);
      if (cpfError) {
        newErrors.cpf = cpfError;
      }
    }
    
    // Password validation
    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Clean CPF for submission
    const cleanCPF = formData.cpf.replace(/\D/g, '');
    
    try {
      await onLogin({
        cpf: cleanCPF,
        senha: formData.senha
      });
    } catch (error) {
      // Error is handled by parent component
    }
  };

  // Handle keyboard submission
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <form onSubmit={handleSubmit} onReset={() => setFormData({ cpf: '', senha: '' })}>
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert role="alert" className="border-red-200 bg-red-50">
            <div className="text-red-800">
              {error}
            </div>
          </Alert>
        )}

        {/* CPF Field */}
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            type="text"
            value={formData.cpf}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="000.000.000-00"
            maxLength={14}
            aria-required="true"
            aria-invalid={!!errors.cpf}
            className={errors.cpf ? 'border-red-300 focus:border-red-500' : ''}
            disabled={loading}
            data-cy="cpf-input"
          />
          {errors.cpf && (
            <div className="text-sm text-red-600" role="alert" data-cy="cpf-error">
              {errors.cpf}
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="senha">Senha</Label>
          <div className="relative">
            <Input
              id="senha"
              name="senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.senha}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua senha"
              aria-required="true"
              aria-invalid={!!errors.senha}
              className={errors.senha ? 'border-red-300 focus:border-red-500 pr-10' : 'pr-10'}
              disabled={loading}
              data-cy="password-input"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tabIndex={-1}
              data-cy="toggle-password"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.senha && (
            <div className="text-sm text-red-600" role="alert" data-cy="password-error">
              {errors.senha}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full"
          disabled={loading}
          data-cy="login-button"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
            disabled={loading}
            data-cy="forgot-password-link"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </form>
  );
}