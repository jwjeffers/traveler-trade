import { useState, useEffect } from 'react';
import { audioService } from './audioService';

const BOOT_MESSAGES = [
  "INITIALIZING IMPERIAL NETWORK INTERFACE...",
  "VERIFYING LOCAL X-BOAT RELAY CACHE...",
  "ESTABLISHING SECURE CONNECTION TO COMM ROUTER X-7...",
  "SYNCHRONIZING STARPORT TRAFFIC DATABASES...",
  "DECRYPTING ACCOUNT LEDGERS...",
  "LOADING SHIP STATUS PROTOCOLS...",
  "TERMINAL ONLINE."
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!started) return;

    audioService.playBoot();
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < BOOT_MESSAGES.length) {
        setMessages(prev => [...prev, BOOT_MESSAGES[index]]);
        audioService.playKeystroke(0.08);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setFading(true);
          setTimeout(onComplete, 500); // Wait for fade out
        }, 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [started, onComplete]);

  const handleStart = () => {
    audioService.init(); // Initialize audio context on user gesture
    setStarted(true);
  };

  return (
    <div className={`crt crt-flicker ${fading ? 'fade-out' : ''}`} style={{ 
      width: '100vw', height: '100vh', 
      background: '#051405', 
      display: 'flex', flexDirection: 'column', 
      justifyContent: 'center', alignItems: 'center',
      position: 'fixed', top: 0, left: 0, zIndex: 9999,
      transition: 'opacity 0.5s ease-in-out',
      opacity: fading ? 0 : 1
    }}>
      {!started ? (
        <button 
          onClick={handleStart}
          style={{ fontSize: '2rem', padding: '20px 40px', borderColor: 'var(--color-phosphor)', animation: 'flicker 1.5s infinite' }}
        >
          INITIALIZE TERMINAL
        </button>
      ) : (
        <div style={{ width: '80%', maxWidth: '800px', textAlign: 'left', minHeight: '300px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '10px', fontSize: '1.2rem' }}>{`> ${msg}`}</div>
          ))}
          {messages.length < BOOT_MESSAGES.length && (
            <div style={{ display: 'inline-block', width: '10px', height: '1.2rem', background: 'var(--color-phosphor)', animation: 'flicker 0.5s infinite' }} />
          )}
        </div>
      )}
    </div>
  );
}
