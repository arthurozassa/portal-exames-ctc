import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Calendar, 
  User, 
  Building,
  FileText,
  Eye,
  ExternalLink
} from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

// Mock exam data
const mockExamData = {
  '1': {
    id: '1',
    type: 'Hemograma Completo',
    date: '2024-06-01',
    status: 'Disponível',
    unit: 'Lab Central',
    doctor: 'Dr. Roberto Santos',
    crm: 'CRM/SP 123456',
    category: 'Análises Clínicas',
    description: 'Avaliação completa dos componentes do sangue incluindo hemácias, leucócitos e plaquetas.',
    results: {
      hemoglobina: '14.2 g/dL',
      hematocrito: '42%',
      leucocitos: '6.800 /mm³',
      plaquetas: '280.000 /mm³'
    },
    referenceValues: {
      hemoglobina: '12.0-15.5 g/dL',
      hematocrito: '36-46%',
      leucocitos: '4.000-11.000 /mm³',
      plaquetas: '150.000-450.000 /mm³'
    },
    interpretation: 'Resultados dentro dos parâmetros normais. Não foram identificadas alterações significativas.',
    pdfUrl: '/pdfs/hemograma-joao-silva.pdf',
    pacsUrl: null,
    requestingPhysician: 'Dra. Ana Costa',
    requestDate: '2024-05-30',
    collectionDate: '2024-06-01',
    releaseDate: '2024-06-01'
  },
  '2': {
    id: '2',
    type: 'Tomografia de Tórax',
    date: '2024-05-28',
    status: 'Disponível',
    unit: 'Centro de Imagem',
    doctor: 'Dra. Fernanda Lima',
    crm: 'CRM/SP 654321',
    category: 'Imagem',
    description: 'Estudo tomográfico do tórax com técnica helicoidal para avaliação de estruturas pulmonares.',
    results: {
      pulmoes: 'Parênquima pulmonar com transparência preservada',
      mediastino: 'Mediastino centrado, sem massas',
      pleura: 'Pleuras livres',
      coracao: 'Silhueta cardíaca de dimensões normais'
    },
    interpretation: 'Exame dentro dos limites da normalidade. Ausência de processos inflamatórios ou neoplásicos evidentes.',
    pdfUrl: '/pdfs/tomografia-torax-joao-silva.pdf',
    pacsUrl: 'https://demo.ohif.org/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78',
    requestingPhysician: 'Dr. Paulo Martins',
    requestDate: '2024-05-25',
    collectionDate: '2024-05-28',
    releaseDate: '2024-05-28'
  }
};

export default function ExamDetail() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const examData = mockExamData[id];
      setExam(examData);
      setLoading(false);
    }, 500);
  }, [id]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleDownload = () => {
    // Simulate PDF download
    const link = document.createElement('a');
    link.href = exam.pdfUrl;
    link.download = `${exam.type}-${exam.date}.pdf`;
    link.click();
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleViewPACS = () => {
    if (exam.pacsUrl) {
      window.open(exam.pacsUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
        <Alert>
          <AlertDescription>
            Exame não encontrado. Verifique se o ID está correto.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/exams">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exam.type}</h1>
            <p className="text-gray-600">Detalhes do exame</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          {exam.pacsUrl && (
            <Button onClick={handleViewPACS} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver Imagens
            </Button>
          )}
          <Button onClick={handleShare} size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              {exam.status}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Informações do Exame
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Categoria:</span>
                <p className="text-gray-900">{exam.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Data de Coleta:</span>
                <p className="text-gray-900">{formatDate(exam.collectionDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Data de Liberação:</span>
                <p className="text-gray-900">{formatDate(exam.releaseDate)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Unidade:</span>
                <p className="text-gray-900">{exam.unit}</p>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Descrição:</span>
              <p className="text-gray-900 mt-1">{exam.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Medical Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Equipe Médica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium text-gray-700">Médico Responsável:</span>
              <p className="text-gray-900">{exam.doctor}</p>
              <p className="text-sm text-gray-600">{exam.crm}</p>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Médico Solicitante:</span>
              <p className="text-gray-900">{exam.requestingPhysician}</p>
              <p className="text-sm text-gray-600">Data da Solicitação: {formatDate(exam.requestDate)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            Valores obtidos no exame
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-700">Parâmetro</th>
                  <th className="text-left p-2 font-medium text-gray-700">Resultado</th>
                  {exam.referenceValues && (
                    <th className="text-left p-2 font-medium text-gray-700">Valores de Referência</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.entries(exam.results).map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-2 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</td>
                    <td className="p-2">{value}</td>
                    {exam.referenceValues && (
                      <td className="p-2 text-gray-600">{exam.referenceValues[key] || '-'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interpretation */}
      {exam.interpretation && (
        <Card>
          <CardHeader>
            <CardTitle>Interpretação</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{exam.interpretation}</p>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Importante:</strong> Esta interpretação é fornecida apenas para fins informativos. 
                Sempre consulte seu médico para uma avaliação completa dos resultados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={handleDownload} variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            
            {exam.pacsUrl && (
              <Button onClick={handleViewPACS} variant="outline" className="justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                Visualizar Imagens (PACS)
              </Button>
            )}
            
            <Button onClick={handleShare} variant="outline" className="justify-start">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar com Médico
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}