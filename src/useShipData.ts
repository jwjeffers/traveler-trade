import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import type { CompanyData } from './ShipStatus';
import { defaultCompanyData } from './ShipStatus';

export function useShipData(shipId: string) {
  const [data, setData] = useState<CompanyData>(() => {
    const saved = localStorage.getItem('companyData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.ships) {
           return { passcode: parsed.passcode || '0000', crewRoster: parsed.crewRoster || [], ships: [ { ...defaultCompanyData.ships[0], ...parsed, id: 'legacy-ship' } ] };
        }
        parsed.ships = parsed.ships.map((s: any) => ({ ...defaultCompanyData.ships[0], ...s }));
        return { ...defaultCompanyData, ...parsed };
      } catch(e) { return defaultCompanyData; }
    }
    return defaultCompanyData;
  });
  
  const [isOnline, setIsOnline] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const fetchCloudData = async () => {
      const { data: row, error } = await supabase
        .from('ship_state')
        .select('data')
        .eq('id', shipId)
        .single();
        
      if (row && row.data) {
        setIsOnline(true);
        let incoming = row.data as any;
        if (!incoming.ships) {
           incoming = { passcode: incoming.passcode || '0000', crewRoster: incoming.crewRoster || [], ships: [ { ...defaultCompanyData.ships[0], ...incoming, id: 'legacy-ship' } ] };
        } else {
           incoming.ships = incoming.ships.map((s: any) => ({ ...defaultCompanyData.ships[0], ...s }));
        }
        setData({ ...defaultCompanyData, ...incoming });
        localStorage.setItem('companyData', JSON.stringify({ ...defaultCompanyData, ...incoming }));
      } else if (error && error.code === 'PGRST116') {
        setData({ ...defaultCompanyData, deleted: true } as any);
      }
    };

    fetchCloudData();

    channelRef.current = supabase.channel(`ship-sync-room-${shipId}`, {
      config: { broadcast: { ack: true, self: false } }
    });

    channelRef.current.on('broadcast', { event: 'state-update' }, (payload) => {
      let incoming = payload.payload.data;
      if (!incoming.ships) {
          incoming = { passcode: incoming.passcode || '0000', crewRoster: incoming.crewRoster || [], ships: [ { ...defaultCompanyData.ships[0], ...incoming, id: 'legacy-ship' } ] };
      } else {
          incoming.ships = incoming.ships.map((s: any) => ({ ...defaultCompanyData.ships[0], ...s }));
      }
      setData({ ...defaultCompanyData, ...incoming });
      localStorage.setItem('companyData', JSON.stringify({ ...defaultCompanyData, ...incoming }));
    }).subscribe((status) => {
      if (status === 'SUBSCRIBED') setIsOnline(true);
    });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [shipId]);

  const updateShipData = (updates: Partial<CompanyData>) => {
    setData(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('companyData', JSON.stringify(next));
      if (isOnline && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'state-update',
          payload: { data: next }
        });
        supabase.from('ship_state').update({ data: next }).eq('id', shipId).then();
      }
      return next;
    });
  };

  return { shipData: data, updateShipData, isOnline };
}
