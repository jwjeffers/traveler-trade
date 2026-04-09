import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabaseClient';
import type { ShipData } from './ShipStatus';

// We need to move defaultShipData to here, or export it from ShipStatus. 
// Since we are creating this file, let's just import the default from ShipStatus.
import { defaultShipData } from './ShipStatus';

export function useShipData(shipId: string) {
  const [data, setData] = useState<ShipData>(() => {
    // Try to instantly load local cache while waiting for network
    const saved = localStorage.getItem('shipData');
    if (saved) return { ...defaultShipData, ...JSON.parse(saved) };
    return defaultShipData;
  });
  
  const [isOnline, setIsOnline] = useState(false);
  
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initial Fetch & Subscribe
  useEffect(() => {
    const fetchCloudData = async () => {
      const { data: row, error } = await supabase
        .from('ship_state')
        .select('data')
        .eq('id', shipId)
        .single();
        
      if (row && row.data) {
        setIsOnline(true);
        setData(prev => ({ ...prev, ...(row.data as ShipData) }));
        localStorage.setItem('shipData', JSON.stringify(row.data));
      } else if (error && error.code === 'PGRST116') {
        await supabase.from('ship_state').insert({ id: shipId, data: data });
        setIsOnline(true);
      }
    };

    fetchCloudData();

    // Setup an instant Broadcast channel
    channelRef.current = supabase.channel(`ship-sync-room-${shipId}`, {
      config: {
        broadcast: { ack: true, self: false }
      }
    });

    channelRef.current.on('broadcast', { event: 'state-update' }, (payload) => {
      const incomingData = payload.payload.data as ShipData;
      setData(incomingData);
      localStorage.setItem('shipData', JSON.stringify(incomingData));
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') setIsOnline(true);
    });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [shipId]);

  const updateDataCallback = useCallback((updates: Partial<ShipData>) => {
    setData((prev) => {
      const newData = { ...prev, ...updates };
      
      // Save locally instantly
      localStorage.setItem('shipData', JSON.stringify(newData));
      
      // Instantly broadcast the state to everyone else in the room
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'state-update',
          payload: { data: newData }
        });
      }
      
      // Debounce the heavy push to the Postgres database for persistence
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(async () => {
        await supabase
          .from('ship_state')
          .update({ data: newData })
          .eq('id', shipId);
      }, 1000); // 1s buffer for db writes

      return newData;
    });
  }, [shipId]);

  return { shipData: data, updateShipData: updateDataCallback, isOnline };
}
