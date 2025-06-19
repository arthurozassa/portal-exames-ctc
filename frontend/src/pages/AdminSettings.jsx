import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import QualityIndicators from '../components/admin/QualityIndicators'
import SystemStatus from '../components/admin/SystemStatus'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'quality', label: 'Qualidade & Testes', icon: '🧪' },
    { id: 'status', label: 'Status dos Serviços', icon: '⚡' },
    { id: 'config', label: 'Configurações', icon: '⚙️' },
    { id: 'users', label: 'Usuários', icon: '👥' },
    { id: 'logs', label: 'Logs & Auditoria', icon: '📋' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-600">
          Monitoramento e configuração do Portal de Exames CTC
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Resumo Executivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">1,247</div>
                  <p className="text-xs text-green-600">+12% este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Exames Processados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">8,423</div>
                  <p className="text-xs text-green-600">+8% este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">99.8%</div>
                  <p className="text-xs text-gray-600">Últimos 30 dias</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">4.9/5</div>
                  <p className="text-xs text-gray-600">Baseado em 234 avaliações</p>
                </CardContent>
              </Card>
            </div>

            {/* Preview das outras seções */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🧪</span>
                    <span>Qualidade dos Testes</span>
                  </CardTitle>
                  <CardDescription>Status atual da cobertura de testes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Coverage</span>
                      <span className="font-medium text-green-600">85%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Testes Unitários</span>
                      <span className="font-medium text-green-600">114/114 ✅</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Testes E2E</span>
                      <span className="font-medium text-yellow-600">23/25 ⚠️</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab('quality')}
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>⚡</span>
                    <span>Status dos Serviços</span>
                  </CardTitle>
                  <CardDescription>Monitoramento da infraestrutura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Frontend</span>
                      <span className="font-medium text-green-600">✅ Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Backend API</span>
                      <span className="font-medium text-green-600">✅ Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database</span>
                      <span className="font-medium text-green-600">✅ Online</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    onClick={() => setActiveTab('status')}
                  >
                    Ver Status Completo
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'quality' && <QualityIndicators />}
        
        {activeTab === 'status' && <SystemStatus />}

        {activeTab === 'config' && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configurações gerais do Portal de Exames CTC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">White-label & Branding</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo da Instituição
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <p className="text-gray-600">Clique para fazer upload do logo</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor Primária
                      </label>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="color" 
                          defaultValue="#3B82F6" 
                          className="w-12 h-10 border border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-600">#3B82F6</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Configurações de Exames</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Exames em Timeline</div>
                        <div className="text-sm text-gray-600">Mostrar gráficos de evolução</div>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Compartilhamento por Email</div>
                        <div className="text-sm text-gray-600">Permitir envio de exames por email</div>
                      </div>
                      <input type="checkbox" defaultChecked className="toggle" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Administração de usuários e permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Funcionalidade de gerenciamento de usuários será implementada aqui.
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>Logs e Auditoria</CardTitle>
              <CardDescription>
                Registro de atividades e eventos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sistema de logs e auditoria será implementado aqui.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}