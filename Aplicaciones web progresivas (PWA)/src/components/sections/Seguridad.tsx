import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Activity, ShieldCheck, Server, Lock, Bell, Database, Cpu, 
  Terminal, ShieldAlert, Network, Share2, HelpCircle, 
  Play, Pause, RefreshCw, AlertTriangle, Eye, Zap, 
  ArrowRight, Search, CheckCircle2, FileText, Ban, Layers, ListFilter, ArrowLeft
} from 'lucide-react';

// Tipos
type Tab = 'melt' | 'ebpf' | 'platforms';
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
}

interface FalcoAlert {
  id: string;
  timestamp: string;
  priority: 'NOTICE' | 'WARNING' | 'CRITICAL';
  rule: string;
  message: string;
}

interface NetworkFlow {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  port: number;
  protocol: 'TCP' | 'UDP';
  policy: string;
  status: 'PERMITTED' | 'BLOCKED';
}

interface TraceSpan {
  id: string;
  name: string;
  service: string;
  duration: number; // ms
  startOffset: number; // ms
  status: 'OK' | 'ERROR';
  logs?: string[];
  dbQuery?: string;
}

interface JaegerTrace {
  id: string;
  name: string;
  totalDuration: number;
  statusCode: number;
  method: string;
  path: string;
  spans: TraceSpan[];
}

export default function Seguridad({ alNavegar }: { alNavegar?: (id: any) => void }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('melt');
  const [isLive, setIsLive] = useState(true);

  // --- 1. ESTADOS PARA MELT ---
  const [cpuPoints, setCpuPoints] = useState<number[]>([30, 32, 28, 35, 42, 38, 30, 25, 27, 31, 35, 30, 32, 34, 38]);
  const [memPoints, setMemPoints] = useState<number[]>([62, 62, 63, 63, 64, 64, 64, 63, 63, 62, 62, 63, 63, 64, 64]);
  const [reqPoints, setReqPoints] = useState<number[]>([110, 115, 120, 108, 95, 130, 142, 125, 118, 122, 135, 140, 130, 125, 138]);
  const [latPoints, setLatPoints] = useState<number[]>([42, 45, 38, 52, 65, 48, 40, 35, 37, 41, 45, 43, 38, 42, 49]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date(Date.now() - 7000).toLocaleTimeString(), level: 'INFO', service: 'otlp-collector', message: 'OpenTelemetry Collector daemon started successfully' },
    { id: '2', timestamp: new Date(Date.now() - 6000).toLocaleTimeString(), level: 'INFO', service: 'api-gateway', message: 'GET /api/v1/auth/session - 200 OK - 8ms' },
    { id: '3', timestamp: new Date(Date.now() - 5000).toLocaleTimeString(), level: 'WARN', service: 'auth-service', message: 'Database connection pool utilization at 82%' },
    { id: '4', timestamp: new Date(Date.now() - 4000).toLocaleTimeString(), level: 'INFO', service: 'user-service', message: 'GET /api/v1/users/arturo_profile - 200 OK - 15ms' },
    { id: '5', timestamp: new Date(Date.now() - 3000).toLocaleTimeString(), level: 'ERROR', service: 'storage-service', message: 'Failed to write checkpoint block to Ceph cluster' },
    { id: '6', timestamp: new Date(Date.now() - 2000).toLocaleTimeString(), level: 'WARN', service: 'db-pool', message: 'Slow query detected: SELECT * FROM audit_logs ORDER BY date DESC - 410ms' },
    { id: '7', timestamp: new Date(Date.now() - 1000).toLocaleTimeString(), level: 'INFO', service: 'cilium-agent', message: 'eBPF program loaded: l3_egress_filter on interface eth0' },
  ]);
  const [logFilter, setLogFilter] = useState<'ALL' | LogLevel>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // --- 2. ESTADOS PARA eBPF (Falco & Cilium) ---
  const [rules, setRules] = useState([
    { id: 'block_bin_write', name: 'Bloquear escrituras en /bin y /usr/bin', desc: 'Evita que atacantes sobrescriban ejecutables del sistema', enabled: true },
    { id: 'prevent_container_shell', name: 'Prevenir shells interactivas en contenedores', desc: 'Alertar de inmediato si se ejecuta bash/sh dentro de Docker/K8s', enabled: true },
    { id: 'restrict_db_egress', name: 'Restringir tráfico de egreso de Base de Datos', desc: 'La DB sólo puede responder al backend. Bloquea peticiones a internet', enabled: true },
    { id: 'detect_ebpf_hijack', name: 'Detectar inyección de sondas eBPF sospechosas', desc: 'Controla si procesos no firmados cargan programas de kernel', enabled: false },
  ]);
  
  const [falcoAlerts, setFalcoAlerts] = useState<FalcoAlert[]>([
    { id: 'a1', timestamp: new Date(Date.now() - 30000).toLocaleTimeString(), priority: 'WARNING', rule: 'Unauthorized shell spawn', message: 'Interactive shell spawned inside container sandbox-app (user: root)' },
    { id: 'a2', timestamp: new Date(Date.now() - 15000).toLocaleTimeString(), priority: 'CRITICAL', rule: 'Write below binary directory', message: 'File integrity violation detected at /usr/bin/login (binary: node-exploit)' },
  ]);

  const [networkFlows, setNetworkFlows] = useState<NetworkFlow[]>([
    { id: 'f1', timestamp: new Date(Date.now() - 5000).toLocaleTimeString(), source: 'frontend-pod', destination: 'api-gateway', port: 8080, protocol: 'TCP', policy: 'allow-ingress-gateway', status: 'PERMITTED' },
    { id: 'f2', timestamp: new Date(Date.now() - 4000).toLocaleTimeString(), source: 'api-gateway', destination: 'auth-service', port: 443, protocol: 'TCP', policy: 'allow-auth-flow', status: 'PERMITTED' },
    { id: 'f3', timestamp: new Date(Date.now() - 3000).toLocaleTimeString(), source: 'auth-service', destination: 'postgres-db', port: 5432, protocol: 'TCP', policy: 'db-restrictive', status: 'PERMITTED' },
    { id: 'f4', timestamp: new Date(Date.now() - 2000).toLocaleTimeString(), source: 'postgres-db', destination: 'untrusted-ip-china', port: 80, protocol: 'TCP', policy: 'db-egress-block', status: 'BLOCKED' },
    { id: 'f5', timestamp: new Date(Date.now() - 1000).toLocaleTimeString(), source: 'malicious-agent', destination: 'system-kernel', port: 0, protocol: 'UDP', policy: 'ebpf-sys-intercept', status: 'BLOCKED' },
  ]);

  // --- 3. ESTADOS PARA TRACING (Jaeger / SigNoz) ---
  const [selectedTraceId, setSelectedTraceId] = useState<string>('t1');
  const [expandedSpanId, setExpandedSpanId] = useState<string | null>(null);

  const traces: JaegerTrace[] = [
    {
      id: 't1',
      name: 'GET /api/v1/files/list',
      totalDuration: 135,
      statusCode: 200,
      method: 'GET',
      path: '/api/v1/files/list',
      spans: [
        { id: 's1', name: 'api-gateway:route', service: 'api-gateway', duration: 135, startOffset: 0, status: 'OK' },
        { id: 's2', name: 'auth-service:validate', service: 'auth-service', duration: 25, startOffset: 5, status: 'OK' },
        { id: 's3', name: 'redis:get-session', service: 'redis-cache', duration: 3, startOffset: 12, status: 'OK', dbQuery: 'GET session:arturo_token' },
        { id: 's4', name: 'file-service:list', service: 'file-service', duration: 95, startOffset: 35, status: 'OK' },
        { id: 's5', name: 'postgres:query-files', service: 'postgres-db', duration: 88, startOffset: 40, status: 'OK', dbQuery: 'SELECT * FROM files WHERE user_id = $1 LIMIT 50' },
      ]
    },
    {
      id: 't2',
      name: 'POST /api/v1/files/create',
      totalDuration: 420,
      statusCode: 500,
      method: 'POST',
      path: '/api/v1/files/create',
      spans: [
        { id: 's2_1', name: 'api-gateway:post-route', service: 'api-gateway', duration: 420, startOffset: 0, status: 'ERROR' },
        { id: 's2_2', name: 'auth-service:validate', service: 'auth-service', duration: 18, startOffset: 4, status: 'OK' },
        { id: 's2_3', name: 'file-service:create', service: 'file-service', duration: 395, startOffset: 25, status: 'ERROR' },
        { id: 's2_4', name: 'ceph:allocate-block', service: 'storage-service', duration: 380, startOffset: 30, status: 'ERROR', logs: ['Ceph connection timed out after 300ms', 'OSD allocation failure'] },
      ]
    },
    {
      id: 't3',
      name: 'GET /api/v1/auth/metrics',
      totalDuration: 12,
      statusCode: 200,
      method: 'GET',
      path: '/api/v1/auth/metrics',
      spans: [
        { id: 's3_1', name: 'api-gateway:metrics-route', service: 'api-gateway', duration: 12, startOffset: 0, status: 'OK' },
        { id: 's3_2', name: 'prometheus-exporter:scrape', service: 'auth-service', duration: 9, startOffset: 2, status: 'OK' },
      ]
    }
  ];

  // --- SIMULACIÓN DE TELEMETRÍA EN TIEMPO REAL ---
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // 1. Simular Métricas (fluctuaciones)
      setCpuPoints((prev) => {
        const next = Math.max(10, Math.min(95, prev[prev.length - 1] + (Math.random() * 10 - 5)));
        return [...prev.slice(1), Math.round(next)];
      });
      setMemPoints((prev) => {
        const next = Math.max(50, Math.min(98, prev[prev.length - 1] + (Math.random() * 2 - 1)));
        return [...prev.slice(1), Math.round(next)];
      });
      setReqPoints((prev) => {
        const next = Math.max(50, Math.min(300, prev[prev.length - 1] + (Math.random() * 30 - 15)));
        return [...prev.slice(1), Math.round(next)];
      });
      setLatPoints((prev) => {
        const next = Math.max(5, Math.min(500, prev[prev.length - 1] + (Math.random() * 16 - 8)));
        return [...prev.slice(1), Math.round(next)];
      });

      // 2. Simular Logs de OpenTelemetry
      const logServices = ['api-gateway', 'auth-service', 'file-service', 'postgres-db', 'redis-cache', 'storage-service'];
      const messages = {
        INFO: [
          'GET /api/v1/files/download - 200 OK - 45ms',
          'POST /api/v1/auth/token - 200 OK - 14ms',
          'Cache hit for key: user:session:active',
          'OTLP Tracing spans successfully exported to Signoz endpoint',
          'eBPF filter socket buffer read size: 2048 bytes',
        ],
        WARN: [
          'Database connection utilization exceeded 80% (pool size: 50)',
          'Redis memory eviction policy triggered: volatile-lru',
          'High response latency in file-service: 380ms',
          'Cilium network flow monitor: detected packet drops on eth0',
        ],
        ERROR: [
          'Failed to validate token signature: expired credentials',
          'eBPF system call hooking timeout on process sys-log',
          'Postgres connection lost. Reconnecting in 500ms...',
        ]
      };

      const rand = Math.random();
      let selectedLevel: LogLevel = 'INFO';
      if (rand > 0.85) selectedLevel = 'WARN';
      if (rand > 0.96) selectedLevel = 'ERROR';

      const pool = messages[selectedLevel as keyof typeof messages];
      const selectedMessage = pool[Math.floor(Math.random() * pool.length)];
      const newLog: LogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        level: selectedLevel,
        service: logServices[Math.floor(Math.random() * logServices.length)],
        message: selectedMessage,
      };

      setLogs((prev) => [...prev.slice(-49), newLog]);

      // 3. Simular flujos de red de Cilium
      if (Math.random() > 0.6) {
        const networkSources = ['frontend-pod', 'api-gateway', 'auth-service', 'postgres-db', 'guest-agent', 'malicious-script'];
        const networkDestinations = ['api-gateway', 'auth-service', 'postgres-db', 'redis-cache', 'internet-ip-block', 'system-kernel'];
        const selectedSrc = networkSources[Math.floor(Math.random() * networkSources.length)];
        const selectedDst = networkDestinations[Math.floor(Math.random() * networkDestinations.length)];
        const allowed = !(selectedSrc === 'guest-agent' && selectedDst === 'system-kernel') && 
                        !(selectedSrc === 'postgres-db' && selectedDst === 'internet-ip-block') &&
                        !(selectedSrc === 'malicious-script');

        const newFlow: NetworkFlow = {
          id: `flow-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          source: selectedSrc,
          destination: selectedDst,
          port: Math.random() > 0.8 ? 5432 : 8080,
          protocol: Math.random() > 0.9 ? 'UDP' : 'TCP',
          policy: allowed ? 'allow-all-internal' : 'ebpf-block-rule',
          status: allowed ? 'PERMITTED' : 'BLOCKED'
        };
        setNetworkFlows((prev) => [newFlow, ...prev.slice(0, 19)]);
      }

    }, 1200);

    return () => clearInterval(interval);
  }, [isLive]);

  // Autodesplazamiento de terminal de logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Simulación de un incidente eBPF/Falco por parte del usuario
  const simularIncidenteFalco = () => {
    const alerts: FalcoAlert[] = [
      {
        id: `alert-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        priority: 'CRITICAL',
        rule: 'Sensitive file modification attempt',
        message: 'Write in directory /etc/shadow by unexpected process (binary: shadow-scanner)'
      },
      {
        id: `alert-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        priority: 'WARNING',
        rule: 'Inbound connection bypass',
        message: 'Cilium eBPF probe detected unauthorized egress packet to malicious malware host 198.51.100.42'
      }
    ];

    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    setFalcoAlerts((prev) => [randomAlert, ...prev]);

    // Añadir log correlacionado inmediatamente
    const correlativeLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      level: 'FATAL',
      service: 'falco-engine',
      message: `eBPF Kernel Event: Security Rule '${randomAlert.rule}' Violated! Action taken: LOGGED & BLOCKED.`
    };
    setLogs((prev) => [...prev, correlativeLog]);
  };

  // Dibujar Sparkline de métricas
  const renderSparkline = (points: number[], maxVal: number, strokeColor: string, fillColor: string) => {
    const width = 140;
    const height = 40;
    const padding = 2;
    const usableHeight = height - padding * 2;
    
    const d = points.reduce((path, p, i) => {
      const x = (i * width) / (points.length - 1);
      const y = height - padding - (p / maxVal) * usableHeight;
      return path + `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }, '');

    const fillD = `${d} L ${width} ${height} L 0 ${height} Z`;

    return (
      <svg width="100%" height={height} className="overflow-visible">
        <path d={fillD} fill={fillColor} className="transition-all duration-300" />
        <path d={d} fill="none" stroke={strokeColor} strokeWidth={1.5} className="transition-all duration-300" />
      </svg>
    );
  };

  // Filtrado de logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter !== 'ALL' && log.level !== logFilter) return false;
    if (logSearch.trim()) {
      const search = logSearch.toLowerCase();
      return (
        log.service.toLowerCase().includes(search) ||
        log.message.toLowerCase().includes(search) ||
        log.level.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const selectedTrace = traces.find(t => t.id === selectedTraceId) || traces[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8 pb-12"
    >
      <header className="flex items-center gap-4 mb-8">
        {alNavegar && (
          <button
            onClick={() => alNavegar('inicio')}
            className="p-2 hover:bg-muted rounded-xl transition-all border border-border/30 hover:border-primary/40 flex items-center justify-center shrink-0 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" strokeWidth={1.5} />
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-medium tracking-[0.2em] text-foreground uppercase leading-none">SEGURIDAD Y MONITORIZACIÓN</h1>
          <p className="font-mono text-muted-foreground uppercase text-xs tracking-[0.3em] opacity-70 mt-1">
            OBSERVABILIDAD (MELT) Y PREVENCIÓN EBPF
          </p>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border hover:border-primary/50 transition-all font-mono text-[9px] uppercase tracking-widest shrink-0 ${
            isLive ? 'bg-primary/10 text-primary border-primary/30' : 'bg-transparent text-muted-foreground'
          }`}
        >
          {isLive ? <Pause className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
          {isLive ? 'Tiempo Real' : 'Pausado'}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border/30 pb-px overflow-x-auto hide-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('melt')}
          className={`py-3 px-5 font-display text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'melt' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Activity className="w-4 h-4" />
          Métricas y Logs (MELT)
        </button>
        <button
          onClick={() => setActiveTab('ebpf')}
          className={`py-3 px-5 font-display text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'ebpf' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Prevención eBPF (Falco & Cilium)
        </button>
        <button
          onClick={() => setActiveTab('platforms')}
          className={`py-3 px-5 font-display text-[10px] sm:text-xs uppercase tracking-widest border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'platforms' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          Plataformas (Jaeger / SigNoz)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* --- PESTAÑA 1: MELT --- */}
        {activeTab === 'melt' && (
          <motion.div
            key="melt"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Grid de Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CPU Card */}
              <div className="ecosystem-card p-4 space-y-3 bg-card/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Uso de CPU (K8s Node)</span>
                  <Cpu className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {cpuPoints[cpuPoints.length - 1]}%
                  </span>
                  <span className="font-mono text-[8px] text-indigo-500/70">PROMETHEUS AGENT</span>
                </div>
                <div className="pt-2">
                  {renderSparkline(cpuPoints, 100, '#6366f1', 'rgba(99, 102, 241, 0.05)')}
                </div>
              </div>

              {/* Memory Card */}
              <div className="ecosystem-card p-4 space-y-3 bg-card/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Uso de Memoria</span>
                  <Database className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {memPoints[memPoints.length - 1]}%
                  </span>
                  <span className="font-mono text-[8px] text-emerald-500/70">EXPORTADOR RAM</span>
                </div>
                <div className="pt-2">
                  {renderSparkline(memPoints, 100, '#10b981', 'rgba(16, 185, 129, 0.05)')}
                </div>
              </div>

              {/* Request Rate */}
              <div className="ecosystem-card p-4 space-y-3 bg-card/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Frecuencia de Peticiones</span>
                  <Activity className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {reqPoints[reqPoints.length - 1]} rps
                  </span>
                  <span className="font-mono text-[8px] text-amber-500/70">OPENTELEMETRY TRACE</span>
                </div>
                <div className="pt-2">
                  {renderSparkline(reqPoints, 350, '#f59e0b', 'rgba(245, 158, 11, 0.05)')}
                </div>
              </div>

              {/* Latency */}
              <div className="ecosystem-card p-4 space-y-3 bg-card/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Latencia Promedio</span>
                  <Zap className="w-4 h-4 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-display font-medium tracking-tight text-foreground">
                    {latPoints[latPoints.length - 1]} ms
                  </span>
                  <span className="font-mono text-[8px] text-rose-500/70">OTEL SPAN METRIC</span>
                </div>
                <div className="pt-2">
                  {renderSparkline(latPoints, 200, '#f43f5e', 'rgba(244, 63, 94, 0.05)')}
                </div>
              </div>
            </div>

            {/* Consola de Logs de OpenTelemetry */}
            <div className="ecosystem-card p-5 bg-card/45 backdrop-blur-lg border-border/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Colector de Logs OpenTelemetry (OTLP)</h3>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">Logs unificados y estructurados en tiempo real</p>
                </div>
                
                <div className="flex items-center flex-wrap gap-2">
                  {/* Filtros */}
                  <div className="flex items-center border border-border/40 rounded-xl px-2 py-1 bg-background/50">
                    <ListFilter className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
                    {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setLogFilter(level)}
                        className={`px-2 py-0.5 rounded-lg font-mono text-[8px] uppercase transition-colors ${
                          logFilter === level 
                            ? 'bg-primary/25 text-primary font-bold' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* Búsqueda */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filtrar logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="bg-background/50 border border-border/40 rounded-xl px-3 py-1 font-mono text-[9px] focus:outline-none focus:border-primary/50 pl-7 w-36 sm:w-44"
                    />
                    <Search className="w-3 h-3 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Terminal */}
              <div className="h-64 rounded-xl border border-border/25 bg-black/60 font-mono text-[10px] p-4 overflow-y-auto space-y-1.5 hide-scrollbar relative">
                {filteredLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-[9px] uppercase tracking-widest">
                    No se encontraron logs que coincidan con la búsqueda
                  </div>
                ) : (
                  filteredLogs.map((log) => {
                    const levelColors = {
                      INFO: 'text-sky-400',
                      WARN: 'text-amber-400',
                      ERROR: 'text-rose-500 font-bold',
                      FATAL: 'bg-rose-500 text-white px-1.5 py-0.5 rounded animate-pulse font-bold'
                    };
                    return (
                      <div key={log.id} className="flex gap-2 leading-relaxed hover:bg-white/5 py-0.5 px-1 rounded transition-colors">
                        <span className="text-muted-foreground/60 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`shrink-0 select-none font-bold ${levelColors[log.level]}`}>[{log.level}]</span>
                        <span className="text-indigo-400 shrink-0 font-semibold">{log.service}:</span>
                        <span className="text-gray-300 break-all">{log.message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </motion.div>
        )}

        {/* --- PESTAÑA 2: eBPF (Falco & Cilium) --- */}
        {activeTab === 'ebpf' && (
          <motion.div
            key="ebpf"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Grid de Reglas y Botón Simulación */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Políticas de Kernel eBPF (Toggles) */}
              <div className="lg:col-span-2 ecosystem-card p-5 space-y-4 bg-card/20 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Reglas de Prevención Activa eBPF</h3>
                    <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">
                      Filtros aplicados en tiempo de ejecución del kernel de Linux
                    </p>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>

                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div key={rule.id} className="flex items-start justify-between gap-4 p-3 rounded-xl border border-border/20 bg-background/30 hover:border-border/40 transition-all">
                      <div>
                        <h4 className="font-display text-[10px] uppercase tracking-[0.1em] text-foreground font-semibold">{rule.name}</h4>
                        <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-widest mt-1">{rule.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r));
                        }}
                        className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                          rule.enabled ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${
                          rule.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Falco Simulator Card */}
              <div className="ecosystem-card p-5 space-y-4 bg-primary/5 border-primary/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Simulador de Amenazas</h3>
                  </div>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-2 leading-relaxed">
                    Ejecuta un ataque de prueba para validar que el motor Falco y la red Cilium intercepten y bloqueen el incidente a nivel de Kernel utilizando filtros eBPF.
                  </p>
                </div>
                <button
                  onClick={simularIncidenteFalco}
                  className="w-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white py-3 rounded-xl font-display text-[10px] uppercase tracking-[0.2em] font-bold transition-all shadow-lg shadow-rose-900/25 flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 animate-bounce" />
                  Simular Ataque en K8s
                </button>
              </div>

            </div>

            {/* Eventos Falco (Kernel Violations) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Alertas Falco */}
              <div className="ecosystem-card p-5 bg-card/25 border-border/30 space-y-4">
                <div>
                  <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Incidentes de Kernel Detectados (Falco)</h3>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">Alertas de llamadas al sistema maliciosas</p>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 hide-scrollbar">
                  {falcoAlerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                        alert.priority === 'CRITICAL' 
                          ? 'border-rose-900/30 bg-rose-950/15' 
                          : 'border-amber-900/30 bg-amber-950/15'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[7px] text-muted-foreground">{alert.timestamp}</span>
                        <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          alert.priority === 'CRITICAL' 
                            ? 'bg-rose-500/25 text-rose-400' 
                            : 'bg-amber-500/25 text-amber-400'
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                      <h4 className="font-display text-[10px] uppercase tracking-[0.1em] text-foreground font-semibold">
                        Violación: {alert.rule}
                      </h4>
                      <p className="font-mono text-[8px] text-gray-300 tracking-wider">
                        {alert.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cilium Network Flows */}
              <div className="ecosystem-card p-5 bg-card/25 border-border/30 space-y-4">
                <div>
                  <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Flujo de Tráfico eBPF (Cilium Network)</h3>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">
                    Conexiones de capa L4 interceptadas en Kernel
                  </p>
                </div>

                <div className="h-56 overflow-y-auto pr-1 hide-scrollbar border border-border/15 rounded-xl bg-background/20 font-mono text-[8px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/20 text-muted-foreground uppercase tracking-widest text-[7px]">
                        <th className="p-2.5">Origen</th>
                        <th className="p-2.5">Destino</th>
                        <th className="p-2.5 text-center">Puerto</th>
                        <th className="p-2.5 text-center">Protocolo</th>
                        <th className="p-2.5 text-right">eBPF Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {networkFlows.map((flow) => (
                        <tr key={flow.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-2.5 text-foreground truncate max-w-[90px]">{flow.source}</td>
                          <td className="p-2.5 text-foreground truncate max-w-[90px]">{flow.destination}</td>
                          <td className="p-2.5 text-center font-semibold text-gray-400">{flow.port === 0 ? 'N/A' : flow.port}</td>
                          <td className="p-2.5 text-center text-muted-foreground font-semibold">{flow.protocol}</td>
                          <td className="p-2.5 text-right font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[7px] ${
                              flow.status === 'PERMITTED' 
                                ? 'bg-green-500/15 text-green-400' 
                                : 'bg-rose-500/15 text-rose-400'
                            }`}>
                              {flow.status === 'PERMITTED' ? 'PERMITIDO' : 'BLOQUEADO'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* --- PESTAÑA 3: PLATAFORMAS (JAEGER / SIGNOZ) --- */}
        {activeTab === 'platforms' && (
          <motion.div
            key="platforms"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Cabecera SigNoz/Jaeger & Selector */}
            <div className="ecosystem-card p-5 bg-card/20 backdrop-blur-md border-border/30 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Trazado Distribuido de Transacciones (Jaeger SDK)</h3>
                  <p className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground mt-1">
                    Visualiza y depura cuellos de botella de microservicios mediante spans unificados
                  </p>
                </div>
                
                {/* Selector de Trazas */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">Trace:</span>
                  <select
                    value={selectedTraceId}
                    onChange={(e) => {
                      setSelectedTraceId(e.target.value);
                      setExpandedSpanId(null);
                    }}
                    className="bg-background border border-border/40 rounded-xl px-3 py-1.5 font-mono text-[9px] focus:outline-none focus:border-primary/50 text-foreground"
                  >
                    {traces.map((trace) => (
                      <option key={trace.id} value={trace.id}>
                        {trace.method} {trace.path} ({trace.totalDuration}ms)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resumen de la Traza */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 rounded-xl border border-border/15 bg-background/20 font-mono text-[9px]">
                <div>
                  <div className="text-muted-foreground uppercase tracking-widest">Trace ID</div>
                  <div className="text-foreground font-semibold mt-0.5">{selectedTrace.id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase tracking-widest">Método / Path</div>
                  <div className="text-primary font-bold mt-0.5">{selectedTrace.method} {selectedTrace.path}</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase tracking-widest">Duración Total</div>
                  <div className="text-foreground font-bold mt-0.5">{selectedTrace.totalDuration} ms</div>
                </div>
                <div>
                  <div className="text-muted-foreground uppercase tracking-widest">Código de Estado</div>
                  <div className={`font-bold mt-0.5 ${selectedTrace.statusCode === 200 ? 'text-green-400' : 'text-rose-500'}`}>
                    {selectedTrace.statusCode} {selectedTrace.statusCode === 200 ? 'OK' : 'Error'}
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico en Cascada de Spans (Jaeger Waterfall) */}
            <div className="ecosystem-card p-5 bg-card/25 border-border/30 space-y-4">
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Línea de Tiempo de Spans</h3>
              
              <div className="space-y-2 border border-border/15 rounded-xl p-3 bg-background/30 max-h-80 overflow-y-auto hide-scrollbar">
                {selectedTrace.spans.map((span) => {
                  const percentWidth = (span.duration / selectedTrace.totalDuration) * 100;
                  const percentOffset = (span.startOffset / selectedTrace.totalDuration) * 100;
                  const isExpanded = expandedSpanId === span.id;

                  return (
                    <div key={span.id} className="space-y-1">
                      <div 
                        onClick={() => setExpandedSpanId(isExpanded ? null : span.id)}
                        className={`p-2.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors ${
                          isExpanded ? 'border-primary/50 bg-primary/5' : 'border-border/10 bg-background/10 hover:bg-white/5'
                        }`}
                      >
                        {/* Servicio y Nombre del Span */}
                        <div className="flex items-center gap-2 md:w-1/4 shrink-0 min-w-0">
                          <span className={`w-2 h-2 rounded-full ${
                            span.status === 'ERROR' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                          }`} />
                          <div className="truncate">
                            <span className="font-mono text-[8px] text-muted-foreground font-semibold">[{span.service}]</span>
                            <h4 className="font-display text-[10px] uppercase tracking-[0.1em] text-foreground font-semibold truncate mt-0.5">{span.name}</h4>
                          </div>
                        </div>

                        {/* Barra de Línea de Tiempo */}
                        <div className="flex-1 h-6 bg-border/5 rounded-lg relative overflow-hidden flex items-center px-1">
                          <div 
                            className={`h-4 rounded-md flex items-center px-1.5 font-mono text-[8px] text-white font-bold transition-all ${
                              span.status === 'ERROR' ? 'bg-rose-600' : 'bg-primary'
                            }`}
                            style={{ 
                              width: `${Math.max(8, percentWidth)}%`, 
                              marginLeft: `${percentOffset}%`
                            }}
                          >
                            <span className="truncate opacity-90">{span.duration}ms</span>
                          </div>
                        </div>

                        <div className="font-mono text-[9px] font-semibold text-muted-foreground shrink-0 md:text-right">
                          {span.duration} ms
                        </div>
                      </div>

                      {/* Detalles del Span Expandido */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden bg-background/45 border-x border-b border-border/20 rounded-b-xl -mt-1"
                          >
                            <div className="p-3.5 space-y-3 font-mono text-[8px] uppercase tracking-widest text-muted-foreground leading-relaxed">
                              <div>
                                <span className="text-foreground font-bold">Span ID:</span> {span.id}
                              </div>
                              {span.dbQuery && (
                                <div className="space-y-1.5">
                                  <span className="text-foreground font-bold">Consulta a Base de Datos (SQL):</span>
                                  <div className="bg-black/60 p-2.5 rounded-lg text-emerald-400 normal-case select-text break-all border border-border/25 leading-normal">
                                    {span.dbQuery}
                                  </div>
                                </div>
                              )}
                              {span.logs && span.logs.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-foreground font-bold">Eventos / Excepciones:</span>
                                  <div className="space-y-1 mt-1 font-mono text-[8px] text-rose-400">
                                    {span.logs.map((log, idx) => (
                                      <div key={idx} className="flex gap-2 bg-rose-500/10 p-1.5 rounded border border-rose-900/30">
                                        <span>[!]</span>
                                        <span>{log}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!span.dbQuery && (!span.logs || span.logs.length === 0) && (
                                <div>
                                  <span className="text-foreground font-bold">Metadatos del Span:</span> otel.kind = INTERNAL, status.code = OK, service.version = 1.0.0
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SigNoz Bottlenecks and Recommendations */}
            <div className="ecosystem-card p-5 bg-card/25 border-border/30 space-y-4">
              <h3 className="font-display text-[11px] uppercase tracking-[0.2em] text-foreground">Depurador y Diagnóstico Automático (SigNoz AI)</h3>
              
              <div className="space-y-2">
                {selectedTrace.statusCode === 500 ? (
                  <div className="p-3.5 rounded-xl border border-rose-950/40 bg-rose-950/10 flex items-start gap-3">
                    <Ban className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display text-[10px] uppercase tracking-[0.1em] text-rose-400 font-bold">Error Crítico Detectado en el Span: `storage-service`</h4>
                      <p className="font-mono text-[8px] text-gray-300 uppercase tracking-widest mt-1.5 leading-normal">
                        La petición falló en el microservicio de almacenamiento debido a un tiempo de espera excedido con el clúster Ceph (`timed out after 300ms`).
                      </p>
                      <p className="font-mono text-[8px] text-rose-500/80 uppercase tracking-widest mt-2 font-bold">
                        Sugerencia: Verificar el estado de los OSD en Ceph y la latencia de la red de almacenamiento.
                      </p>
                    </div>
                  </div>
                ) : selectedTrace.totalDuration > 100 ? (
                  <div className="p-3.5 rounded-xl border border-amber-950/40 bg-amber-950/10 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display text-[10px] uppercase tracking-[0.1em] text-amber-400 font-bold">Cuello de Botella Detectado (Latencia Alta)</h4>
                      <p className="font-mono text-[8px] text-gray-300 uppercase tracking-widest mt-1.5 leading-normal">
                        La consulta SQL en `postgres:query-files` representa el 65% de la duración total de la transacción ({selectedTrace.spans.find(s=>s.id==='s5')?.duration}ms de {selectedTrace.totalDuration}ms).
                      </p>
                      <p className="font-mono text-[8px] text-amber-500/80 uppercase tracking-widest mt-2 font-bold">
                        Sugerencia: Añadir índice en `files(user_id)` o limitar el volumen de columnas seleccionadas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-emerald-950/40 bg-emerald-950/10 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-display text-[10px] uppercase tracking-[0.1em] text-emerald-400 font-bold">Rendimiento Óptimo de la Transacción</h4>
                      <p className="font-mono text-[8px] text-gray-300 uppercase tracking-widest mt-1.5 leading-normal">
                        Todos los spans se completaron en {selectedTrace.totalDuration}ms. La utilización de caché en Redis mantuvo la validación de sesión por debajo de 3ms.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
