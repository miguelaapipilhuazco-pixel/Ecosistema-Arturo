import { useState, useEffect } from 'react';

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Comprobar si ya está instalado
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir el comportamiento predeterminado del navegador
      e.preventDefault();
      // Guardar el evento para dispararlo después
      setInstallPrompt(e);
      setIsInstallable(true);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      console.log('Proyecto Feria de Ciencias PWA se instaló correctamente.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('El prompt de instalación no está disponible.');
      return false;
    }

    try {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó la instalación.');
        setInstallPrompt(null);
        setIsInstallable(false);
        setIsInstalled(true);
        return true;
      } else {
        console.log('El usuario rechazó la instalación.');
      }
    } catch (err) {
      console.error('Error al solicitar la instalación de la PWA:', err);
    }
    return false;
  };

  return { isInstallable, isInstalled, installApp };
}
