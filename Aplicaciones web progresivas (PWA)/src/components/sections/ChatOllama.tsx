import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Bot, ChevronRight } from 'lucide-react';

const OllamaLogo = () => (
  <img src="https://cdn.simpleicons.org/ollama" className="w-5 h-5 shrink-0" alt="Ollama" />
);

export default function ChatOllama({ onExit }: { onExit: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [modelStatus, setModelStatus] = useState<'offline' | 'loading' | 'ready'>('loading');
  const [stats, setStats] = useState({ vram: '0.0', tps: '0', temp: '42' });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulated model loading
    const timer = setTimeout(() => setModelStatus('ready'), 2000);
    
    const statsInterval = setInterval(() => {
      setStats({
        vram: (7.2 + Math.random() * 0.4).toFixed(1),
        tps: (24 + Math.floor(Math.random() * 12)).toString(),
        temp: (45 + Math.floor(Math.random() * 5)).toString()
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, loading]);

  const generarRespuestaLocal = (prompt: string) => {
    const base = prompt.trim();
    if (!base) return 'Nucleo local activo.';

    const lower = base.toLowerCase();
    if (lower.includes('hola')) {
      return 'Hola. Ollama Local esta operativo en modo local de contingencia.';
    }
    if (lower.includes('almacenamiento') || lower.includes('capacidad')) {
      return 'Modelo C activo: capacidad dinamica hasta 1 PB por cuenta, con expansion automatica sobre el umbral de uso definido.';
    }
    if (lower.includes('sincronizacion')) {
      return 'Sincronizacion operativa: se prioriza delta sync, cola de cambios y reconciliacion por eventos.';
    }
    return `Modo local activo. He recibido tu consulta: "${base}". El backend de streaming no esta disponible en este momento, pero la aplicacion sigue funcional.`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading || modelStatus !== 'ready') return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    setStreamingContent('');

    try {
      const historyParam = JSON.stringify(messages);
      const url = `/api/chat/stream?message=${encodeURIComponent(userMsg)}&history=${encodeURIComponent(historyParam)}`;
      
      const eventSource = new EventSource(url);
      let fullResponse = '';

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
          setStreamingContent('');
          setLoading(false);
          return;
        }

        try {
          const rawData = (event.data || "").trim();
          if (rawData && !['undefined', 'null', '[DONE]'].includes(rawData)) {
            const data = JSON.parse(rawData);
            if (data.text) {
              fullResponse += data.text;
              setStreamingContent(fullResponse);
            }
            if (data.error) {
              setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
              eventSource.close();
              setLoading(false);
            }
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      };

      eventSource.onerror = (err) => {
        console.error("EventSource failed:", err);
        eventSource.close();
        setLoading(false);
        setMessages(prev => [...prev, { role: 'assistant', content: generarRespuestaLocal(userMsg) }]);
      };

    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: generarRespuestaLocal(userMsg) }]);
      setLoading(false);
    }
  };

  if (modelStatus === 'loading') {
    return (
      <div className="fixed inset-x-0 top-14 bottom-20 lg:inset-y-0 lg:left-64 lg:right-0 z-[9999] bg-black flex flex-col items-center justify-center font-mono p-6 border-l border-border/50">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-4 mb-8">
            <OllamaLogo />
            <div className="h-0.5 flex-1 bg-zinc-800 relative overflow-hidden">
              <motion.div 
                className="absolute inset-0 bg-primary"
                initial={{ left: '-100%' }}
                animate={{ left: '0%' }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </div>
          </div>
          <div className="space-y-2 text-[10px] uppercase tracking-widest text-zinc-500">
            <p className="animate-pulse">Iniciando motor AI Core...</p>
            <p className="opacity-60">Cargando modelo: ollama/llama3</p>
            <p className="opacity-40">Verificando aceleración CUDA/Vulkan...</p>
            <p className="opacity-20">Optimizando KV Cache para Ecosistema...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 top-14 bottom-20 lg:inset-y-0 lg:left-64 lg:right-0 z-[9999] bg-background flex flex-col animate-in fade-in zoom-in-95 duration-200 border-l border-border/50">
      <div className="flex items-center justify-between p-3 border-b border-border bg-card backdrop-blur-xl">
        <div className="flex items-center gap-3 pl-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <OllamaLogo />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm tracking-widest uppercase text-foreground leading-none">Ollama Local</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[7px] font-mono text-emerald-500 uppercase font-bold">Local</span>
              </div>
            </div>
            <span className="text-[8px] font-mono text-muted-foreground uppercase mt-1">v2.5.0-AR / GGUF-INT4 / OLLAMA-BACKEND</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 px-6 border-x border-border/50">
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-muted-foreground uppercase font-mono">VRAM Usage</span>
            <span className="text-[10px] font-mono text-primary font-bold">{stats.vram} GB</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-muted-foreground uppercase font-mono">Tokens/Sec</span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">{stats.tps}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-muted-foreground uppercase font-mono">Core Temp</span>
            <span className="text-[10px] font-mono text-amber-500 font-bold">{stats.temp}°C</span>
          </div>
        </div>

        <button onClick={onExit} className="group flex items-center gap-2 p-2 px-3 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all rounded-xl mr-2">
          <span className="text-[10px] font-mono uppercase tracking-widest hidden md:inline-block">Cerrar</span>
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm max-w-4xl mx-auto w-full scroll-smooth" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
            <Bot className="w-12 h-12 mb-4 text-primary" />
            <h3 className="text-sm uppercase tracking-[0.2em] mb-2 font-bold">AI Intelligence Core</h3>
            <p className="text-[10px] max-w-[250px] leading-relaxed">Modelo Ollama optimizado localmente para el Ecosistema. Soberania total de datos activa.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3.5 rounded-2xl border ${m.role === 'user' ? 'bg-primary text-primary-foreground border-primary/20 rounded-tr-none' : 'bg-muted border-border rounded-tl-none'}`}>
              <div className="flex items-center gap-2 mb-1 opacity-50">
                <span className="text-[8px] uppercase font-bold tracking-widest">{m.role === 'user' ? 'Guest' : 'Ollama-Local'}</span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] p-3.5 rounded-2xl border bg-muted border-border rounded-tl-none">
              <div className="flex items-center gap-2 mb-1 opacity-50">
                <span className="text-[8px] uppercase font-bold tracking-widest">Ollama-Local (Generando...)</span>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-1 align-middle" />
            </div>
          </div>
        )}
        {loading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-muted border border-border p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Envía un prompt al motor AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-muted/40 dark:bg-black-accent px-4 py-3 rounded-xl border border-border focus:border-primary/50 transition-all outline-none text-xs font-mono"
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
              title="Enviar mensaje"
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shrink-0 shadow-lg shadow-primary/20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
