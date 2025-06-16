import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, FileText, Download, Share2, Calendar } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// Mock data
const mockExams = [
  {
    id: '1',
    type: 'Hemograma Completo',
    date: '2024-06-01',
    status: 'Disponível',
    unit: 'Lab Central',
    doctor: 'Dr. Roberto Santos',
    category: 'Análises Clínicas'
  },
  {
    id: '2',
    type: 'Tomografia de Tórax',
    date: '2024-05-28',
    status: 'Disponível',
    unit: 'Centro de Imagem',
    doctor: 'Dra. Fernanda Lima',
    category: 'Imagem'
  },
  {
    id: '3',
    type: 'Ecocardiograma',
    date: '2024-05-15',
    status: 'Disponível',
    unit: 'Cardiologia',
    doctor: 'Dr. Carlos Mendes',
    category: 'Cardiologia'
  },
  {
    id: '4',
    type: 'Glicemia de Jejum',
    date: '2024-05-10',
    status: 'Disponível',
    unit: 'Lab Central',
    doctor: 'Dr. Roberto Santos',
    category: 'Análises Clínicas'
  },
  {
    id: '5',
    type: 'Raio-X Tórax',
    date: '2024-04-20',
    status: 'Disponível',
    unit: 'Centro de Imagem',
    doctor: 'Dra. Fernanda Lima',
    category: 'Imagem'
  }
];

const statusColors = {
  'Disponível': 'bg-green-100 text-green-800',
  'Processando': 'bg-yellow-100 text-yellow-800',
  'Pendente': 'bg-gray-100 text-gray-800'
};

export default function ExamList() {
  const [exams, setExams] = useState(mockExams);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [...new Set(mockExams.map(exam => exam.category))];

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || exam.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meus Exames</h1>
          <p className="text-gray-600">
            Visualize e gerencie seus resultados de exames
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Baixar Todos
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{exams.length}</p>
                <p className="text-sm text-gray-600">Total de Exames</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {exams.filter(e => e.status === 'Disponível').length}
                </p>
                <p className="text-sm text-gray-600">Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Share2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">2</p>
                <p className="text-sm text-gray-600">Compartilhados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar por exame, médico ou unidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Exames</CardTitle>
          <CardDescription>
            {filteredExams.length} exame(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Exame</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{exam.type}</div>
                        <div className="text-sm text-gray-500">{exam.category}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(exam.date)}</TableCell>
                    <TableCell>{exam.doctor}</TableCell>
                    <TableCell>{exam.unit}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[exam.status]}`}>
                        {exam.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/exams/${exam.id}`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredExams.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum exame encontrado com os filtros aplicados.</p>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                }}
                className="mt-2"
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}