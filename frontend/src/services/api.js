import axios from 'axios';

// Configuração base da API
const api = axios.create({
  baseURL: process.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

// Interceptor para adicionar token às requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Mock data para demonstração
const mockExams = [
  {
    id: '1',
    type: 'Tomografia Computadorizada',
    description: 'TC de Tórax sem contraste',
    date: '2024-03-15',
    status: 'Disponível',
    doctor: 'Dr. Carlos Silva',
    institution: 'Hospital São Paulo',
    pdfUrl: '/mock-pdf/exam-1.pdf',
    pacsUrl: 'https://ohif-demo.netlify.app/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
    results: 'Exame dentro dos parâmetros normais'
  },
  {
    id: '2',
    type: 'Ressonância Magnética',
    description: 'RM de Crânio com contraste',
    date: '2024-03-10',
    status: 'Disponível',
    doctor: 'Dra. Ana Santos',
    institution: 'Clínica Radiológica',
    pdfUrl: '/mock-pdf/exam-2.pdf',
    pacsUrl: 'https://ohif-demo.netlify.app/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.2',
    results: 'Pequena alteração na região temporal'
  },
  {
    id: '3',
    type: 'Ultrassonografia',
    description: 'US de Abdome Total',
    date: '2024-03-05',
    status: 'Disponível',
    doctor: 'Dr. Roberto Lima',
    institution: 'Centro de Diagnóstico',
    pdfUrl: '/mock-pdf/exam-3.pdf',
    pacsUrl: null,
    results: 'Órgãos abdominais sem alterações'
  }
];

// Serviços da API
export const authService = {
  login: async (cpf, password, twoFactorCode) => {
    // Simulação - na implementação real seria uma requisição real
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (cpf === '12345678901' && password === '123456') {
      return {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          name: 'João Silva',
          cpf: cpf,
          email: 'joao.silva@email.com'
        }
      };
    }
    throw new Error('Credenciais inválidas');
  },

  resetPassword: async (cpf) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { message: 'Token enviado para o email cadastrado' };
  },

  confirmResetPassword: async (token, newPassword) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { message: 'Senha alterada com sucesso' };
  }
};

export const examService = {
  getExams: async (filters = {}) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredExams = [...mockExams];
    
    if (filters.type) {
      filteredExams = filteredExams.filter(exam => 
        exam.type.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    
    if (filters.dateFrom) {
      filteredExams = filteredExams.filter(exam => 
        new Date(exam.date) >= new Date(filters.dateFrom)
      );
    }
    
    if (filters.dateTo) {
      filteredExams = filteredExams.filter(exam => 
        new Date(exam.date) <= new Date(filters.dateTo)
      );
    }
    
    return filteredExams;
  },

  getExamById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const exam = mockExams.find(e => e.id === id);
    if (!exam) throw new Error('Exame não encontrado');
    return exam;
  },

  shareExamWithDoctor: async (examId, doctorCrm, message) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const shareToken = `share-${examId}-${Date.now()}`;
    return {
      shareToken,
      expiresIn: '7 dias',
      message: 'Exame compartilhado com sucesso'
    };
  },

  getSharedExams: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: '1',
        examId: '1',
        doctorCrm: '12345-SP',
        doctorName: 'Dr. Paulo Medeiros',
        sharedAt: '2024-03-16',
        expiresAt: '2024-03-23',
        status: 'Ativo'
      }
    ];
  },

  revokeExamAccess: async (shareId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: 'Acesso revogado com sucesso' };
  }
};

export const delegationService = {
  createDelegation: async (delegateData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: Date.now().toString(),
      ...delegateData,
      status: 'Ativo',
      createdAt: new Date().toISOString()
    };
  },

  getDelegations: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: '1',
        delegateName: 'Maria Silva',
        delegateCpf: '98765432100',
        relationship: 'Cônjuge',
        permissions: ['view_exams', 'share_exams'],
        status: 'Ativo',
        createdAt: '2024-03-01'
      }
    ];
  },

  revokeDelegation: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { message: 'Delegação revogada com sucesso' };
  }
};

export default api;