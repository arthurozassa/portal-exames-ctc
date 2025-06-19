import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
  needsConsent: false,
  requires2FA: false,
  tempToken: null,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_2FA_REQUIRED: 'LOGIN_2FA_REQUIRED',
  VERIFY_2FA_SUCCESS: 'VERIFY_2FA_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_USER: 'SET_USER',
  SET_CONSENT_NEEDED: 'SET_CONSENT_NEEDED',
  ACCEPT_CONSENT: 'ACCEPT_CONSENT'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        needsConsent: action.payload.needsConsent || false,
        requires2FA: false,
        tempToken: null,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_2FA_REQUIRED:
      return {
        ...state,
        user: action.payload.user,
        tempToken: action.payload.tempToken,
        requires2FA: true,
        isAuthenticated: false,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.VERIFY_2FA_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        requires2FA: false,
        tempToken: null,
        loading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        loading: false
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload
      };

    case AUTH_ACTIONS.SET_CONSENT_NEEDED:
      return {
        ...state,
        needsConsent: true
      };

    case AUTH_ACTIONS.ACCEPT_CONSENT:
      return {
        ...state,
        needsConsent: false
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
          // Set token in api headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Parse user data
          const userData = JSON.parse(user);
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token,
              user: userData,
              needsConsent: userData.needsConsent || false
            }
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      // Mock API response for demo
      if (credentials.cpf === '12345678900' && credentials.senha === 'teste123') {
        const mockUser = {
          id: '1',
          cpf: '12345678900',
          nome: 'João Silva',
          email: 'joao@test.com'
        };

        dispatch({
          type: AUTH_ACTIONS.LOGIN_2FA_REQUIRED,
          payload: {
            user: mockUser,
            tempToken: 'temp-token'
          }
        });
        return { requires2FA: true, user: mockUser };
      } else {
        const errorMessage = 'CPF não encontrado. Verifique e tente novamente.';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (!error.message.includes('CPF não encontrado')) {
        const errorMessage = 'Erro ao fazer login';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      }
      throw error;
    }
  };

  // Verify 2FA function
  const verify2FA = async (token) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

    try {
      // Mock 2FA verification
      if (token === '123456') {
        const finalToken = 'jwt-token-123';
        const user = state.user;

        // Store token and user data
        localStorage.setItem('token', finalToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Set token in api headers
        api.defaults.headers.common['Authorization'] = `Bearer ${finalToken}`;

        dispatch({
          type: AUTH_ACTIONS.VERIFY_2FA_SUCCESS,
          payload: {
            token: finalToken,
            user: user
          }
        });

        return { success: true };
      } else if (token === '000000') {
        const errorMessage = 'O código informado está incorreto.';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw new Error(errorMessage);
      } else if (token === '999999') {
        const errorMessage = 'Este código expirou. Solicite um novo para continuar.';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw new Error(errorMessage);
      } else {
        const errorMessage = 'Código inválido';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
        throw new Error(errorMessage);
      }
    } catch (error) {
      if (!error.message.includes('código')) {
        const errorMessage = 'Erro ao verificar código';
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      }
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Accept LGPD consent
  const acceptConsent = async () => {
    try {
      await api.post('/auth/accept-consent');
      dispatch({ type: AUTH_ACTIONS.ACCEPT_CONSENT });
    } catch (error) {
      console.error('Error accepting consent:', error);
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Request password reset
  const requestPasswordReset = async (cpf) => {
    try {
      const response = await api.post('/auth/forgot-password', { cpf });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (cpf, token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        cpf,
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: updatedUser
      });

      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    verify2FA,
    logout,
    acceptConsent,
    clearError,
    requestPasswordReset,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;