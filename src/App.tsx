import { useState, useEffect } from 'react';
import { ShipTerminal } from './ShipTerminal';
import { Lobby } from './Lobby';
import { BootSequence } from './BootSequence';

export default function App() {
  const [booted, setBooted] = useState(false);
  const [activeShipId, setActiveShipId] = useState<string | null>(() => localStorage.getItem('activeShipId') || null);

  const handleJoin = (shipId: string) => {
    localStorage.setItem('activeShipId', shipId);
    setActiveShipId(shipId);
  };

  const handleExit = () => {
    localStorage.removeItem('activeShipId');
    setActiveShipId(null);
  };

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  if (!activeShipId) {
    return <Lobby onJoin={handleJoin} />;
  }

  return <ShipTerminal shipId={activeShipId} onExit={handleExit} />;
}
