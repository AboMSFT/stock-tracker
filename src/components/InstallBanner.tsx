import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

type Platform = 'ios' | 'chrome' | null;

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edg/i.test(ua);
  if (isIOS) return 'ios';
  if (isChrome) return 'chrome';
  return null;
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true)
  );
}

export function InstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return; // already installed
    if (sessionStorage.getItem('install-dismissed')) return;
    setPlatform(detectPlatform());

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  function dismiss() {
    sessionStorage.setItem('install-dismissed', '1');
    setDismissed(true);
  }

  async function handleInstallChrome() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed || !platform) return null;
  // On Chrome, only show when install prompt is available
  if (platform === 'chrome' && !deferredPrompt) return null;

  return (
    <div className="install-banner">
      <Download size={16} className="install-banner-icon" />
      <span className="install-banner-text">
        {platform === 'ios'
          ? <>Tap <strong>Share 📤</strong> then <strong>"Add to Home Screen"</strong> to install</>
          : 'Install Inwealthment as an app'}
      </span>
      {platform === 'chrome' && (
        <button className="install-banner-btn" onClick={handleInstallChrome}>Install</button>
      )}
      <button className="install-banner-close" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
