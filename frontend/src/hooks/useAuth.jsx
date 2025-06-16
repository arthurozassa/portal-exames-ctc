import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se existe um token no localStorage ao inicializar
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (cpf, password, twoFactorCode = null) => {
    try {
      setLoading(true);
      
      // Simulação de API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simular dados do usuário
      const userData = {
        id: '123456789',
        name: 'João Silva',
        cpf: cpf,
        email: 'joao.silva@email.com',
        phone: '(11) 99999-9999',
        birthDate: '1990-01-01',
        hasAcceptedLGPD: false
      };

      // Simular token
      const token = 'mock-jwt-token-' + Date.now();

      localStorage.setItem('authToken', token);
      localStorage.setItem('userData', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('userData', JSON.stringify(userData));
  };

  const acceptLGPD = () => {
    const updatedUser = { ...user, hasAcceptedLGPD: true };
    updateUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    acceptLGPD
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};