import { useState } from 'react';
import { ShipTerminal } from './ShipTerminal';
import { Lobby } from './Lobby';

export default function App() {
  const [activeShipId, setActiveShipId] = useState<string | null>(() => localStorage.getItem('activeShipId') || null);

  const handleJoin = (shipId: string) => {
    localStorage.setItem('activeShipId', shipId);
    setActiveShipId(shipId);
  };

  const handleExit = () => {
    localStorage.removeItem('activeShipId');
    setActiveShipId(null);
  };

  if (!activeShipId) {
    return <Lobby onJoin={handleJoin} />;
  }

  return <ShipTerminal shipId={activeShipId} onExit={handleExit} />;
}
