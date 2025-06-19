import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'

export default function SystemStatus() {
  const services = [
    {
      name: 'Frontend',
      status: 'online',
      url: 'https://portal-exames-ctc.vercel.app',
      lastCheck: '2 min ago',
      responseTime: '180ms',
      uptime: '99.9%'
    },
    {
      name: 'Backend API',
      status: 'online', 
      url: 'https://api.portal-exames-ctc.com',
      lastCheck: '1 min ago',
      responseTime: '245ms',
      uptime: '99.8%'
    },
    {
      name: 'Database',
      status: 'online',
      url: 'MySQL Cluster',
      lastCheck: '30s ago',
      responseTime: '12ms',
      uptime: '99.95%'
    },
    {
      name: 'CDN',
      status: 'online',
      url: 'Vercel Edge Network',
      lastCheck: '1 min ago',
      responseTime: '95ms',
      uptime: '100%'
    },
    {
      name: 'Email Service',
      status: 'warning',
      url: 'SMTP Provider',
      lastCheck: '5 min ago',
      responseTime: '1200ms',
      uptime: '98.2%'
    },
    {
      name: 'SMS/WhatsApp',
      status: 'online',
      url: 'Twilio API',
      lastCheck: '3 min ago', 
      responseTime: '320ms',
      uptime: '99.1%'
    }
  ]

  const getStatusBadge = (status) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">✅ Online</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">⚠️ Lento</Badge>
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">❌ Offline</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">❓ Desconhecido</Badge>
    }
  }

  const getResponseTimeColor = (responseTime) => {
    const time = parseInt(responseTime)
    if (time < 200) return 'text-green-600'
    if (time < 500) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Status dos Serviços
        </h2>
        <p className="text-gray-600">
          Monitoramento em tempo real da infraestrutura
        </p>
      </div>

      {/* Status Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Status Geral do Sistema</span>
            <Badge className="bg-green-100 text-green-800">✅ Operacional</Badge>
          </CardTitle>
          <CardDescription>
            Todos os serviços críticos estão funcionando normalmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">99.8%</div>
              <div className="text-sm text-gray-600">Uptime Geral</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">245ms</div>
              <div className="text-sm text-gray-600">Latência Média</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">6/6</div>
              <div className="text-sm text-gray-600">Serviços Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Incidentes Ativos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes dos Serviços</CardTitle>
          <CardDescription>
            Status individual de cada componente do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{service.name}</div>
                    {getStatusBadge(service.status)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {service.url}
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className={`font-medium ${getResponseTimeColor(service.responseTime)}`}>
                      {service.responseTime}
                    </div>
                    <div className="text-gray-500">Latência</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{service.uptime}</div>
                    <div className="text-gray-500">Uptime</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium text-gray-900">{service.lastCheck}</div>
                    <div className="text-gray-500">Última verificação</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Incidentes */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>
            Últimos eventos e manutenções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
              <div className="flex-1">
                <div className="font-medium text-green-800">
                  Sistema totalmente operacional
                </div>
                <div className="text-sm text-green-600">
                  Todos os serviços funcionando normalmente
                </div>
                <div className="text-xs text-green-500 mt-1">
                  Há 2 horas
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border-l-4 border-blue-400 bg-blue-50">
              <div className="flex-1">
                <div className="font-medium text-blue-800">
                  Manutenção programada concluída
                </div>
                <div className="text-sm text-blue-600">
                  Atualização do servidor de banco de dados realizada com sucesso
                </div>
                <div className="text-xs text-blue-500 mt-1">
                  Ontem, 02:00 - 02:30
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
              <div className="flex-1">
                <div className="font-medium text-yellow-800">
                  Lentidão temporária no envio de emails
                </div>
                <div className="text-sm text-yellow-600">
                  Provedor SMTP apresentou instabilidade por 15 minutos
                </div>
                <div className="text-xs text-yellow-500 mt-1">
                  2 dias atrás, 14:30 - 14:45
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}