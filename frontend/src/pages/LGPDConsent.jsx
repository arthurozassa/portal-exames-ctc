import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function LGPDConsent() {
  const [loading, setLoading] = useState(false);
  const { acceptLGPD } = useAuth();
  const navigate = useNavigate();

  const handleAccept = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    acceptLGPD();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Termo de Consentimento LGPD</CardTitle>
          <CardDescription>
            Sua privacidade é importante para nós
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="text-sm text-gray-700">
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD), informamos que seus dados 
              pessoais serão tratados de forma segura e transparente.
            </p>
            
            <h4 className="font-semibold mt-4 mb-2">Dados coletados:</h4>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>Informações pessoais (nome, CPF, telefone, e-mail)</li>
              <li>Dados médicos (resultados de exames)</li>
              <li>Logs de acesso e compartilhamento</li>
            </ul>

            <h4 className="font-semibold mt-4 mb-2">Finalidade:</h4>
            <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
              <li>Disponibilização de resultados de exames</li>
              <li>Compartilhamento seguro com profissionais de saúde</li>
              <li>Melhoria dos serviços prestados</li>
            </ul>

            <p className="text-sm text-gray-700 mt-4">
              Você pode revogar este consentimento a qualquer momento através das configurações 
              da sua conta ou entrando em contato conosco.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleAccept} 
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Aceito os Termos'}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => navigate('/login')}
            >
              Não Aceito
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}