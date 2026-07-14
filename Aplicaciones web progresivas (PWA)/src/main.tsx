import React, { ErrorInfo, ReactNode, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Aplicacion from './App.tsx';
import './index.css';
import './i18n';
import { bootstrapHardwareProfile } from './lib/hardwareProfile';

// Componente Error Boundary para diagnosticar y recuperar fallos de React
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  // Declaraciones explícitas para compatibilidad estricta con TypeScript
  props: any;
  setState: any;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '30px',
          background: '#0d0d0f',
          color: '#ececed',
          fontFamily: 'monospace',
          zIndex: 99999,
          position: 'fixed',
          inset: 0,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          borderTop: '3px solid #ff4a4a'
        }}>
          <h1 style={{ color: '#ff4a4a', fontSize: '18px', fontWeight: 'bold', letterSpacing: '0.1em' }}>⚠️ ERROR CRÍTICO DEL SISTEMA</h1>
          <p style={{ fontSize: '12px', color: '#a1a1aa' }}>El Ecosistema Arturo ha experimentado un fallo en tiempo de ejecución. A continuación se detallan los datos técnicos del error:</p>
          
          <div style={{ background: '#16161a', border: '1px border #242426', padding: '15px', borderRadius: '8px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#ff4a4a' }}><strong>Error:</strong> {this.state.error?.toString()}</p>
          </div>

          <div style={{ flex: 1, minHeight: '150px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#a1a1aa' }}><strong>Pila de llamadas (Stack Trace):</strong></p>
            <pre style={{
              background: '#16161a',
              border: '1px solid #242426',
              padding: '15px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '11px',
              lineHeight: '1.6',
              color: '#d1d1d6',
              whiteSpace: 'pre-wrap',
              maxHeight: '400px'
            }}>
              {this.state.errorInfo?.componentStack || this.state.error?.stack || "No hay detalles disponibles."}
            </pre>
          </div>

          <div>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{
                padding: '12px 24px',
                background: '#ececed',
                color: '#0d0d0f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '11px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                transition: 'background 0.2s'
              }}
            >
              Restablecer Caché y Recargar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

async function initDebugConsole() {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const enabledByQuery = params.get('debug') === '1';
  const enabledByStorage = localStorage.getItem('ecosystem_debug') === 'true';

  if (!enabledByQuery && !enabledByStorage) {
    return;
  }

  try {
    const eruda = (await import('eruda')).default;
    if (!(window as any).__ecosystemErudaInitialized) {
      eruda.init();
      (window as any).__ecosystemErudaInitialized = true;
    }
  } catch (error) {
    console.warn('No se pudo inicializar la consola de depuracion', error);
  }
}

void initDebugConsole();
bootstrapHardwareProfile();

if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
  const root = document.getElementById('root');
  if (root) {
    root.textContent = 'Esta app requiere servidor local. Ejecuta npm install y npm run dev en la carpeta Web, luego abre http://localhost:3000';
    root.style.padding = '16px';
    root.style.fontFamily = 'monospace';
    root.style.fontSize = '12px';
  }
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <Aplicacion />
      </ErrorBoundary>
    </StrictMode>,
  );
}

// Retirar el service worker anterior y limpiar caches para eliminar artefactos PWA legados.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => caches.keys())
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('ecosystem-os-cache'))
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => {
        console.log('Service workers y caches PWA eliminados correctamente.');
      })
      .catch((error) => {
        console.error('Error al eliminar el Service Worker legado:', error);
      });
  });
}

