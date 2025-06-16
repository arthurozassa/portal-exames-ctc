import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Aqui você pode acessar seus exames e gerenciar compartilhamentos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Meus Exames</CardTitle>
            <CardDescription>
              Visualize e baixe seus resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">5</div>
            <p className="text-sm text-gray-600">Exames disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compartilhamentos</CardTitle>
            <CardDescription>
              Exames compartilhados com médicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">2</div>
            <p className="text-sm text-gray-600">Compartilhamentos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Última Atualização</CardTitle>
            <CardDescription>
              Último exame adicionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">Hemograma Completo</div>
            <p className="text-sm text-gray-600">01/06/2024</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}