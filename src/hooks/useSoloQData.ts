import { useState, useEffect } from 'react';
import { SOLOQ_DEMO_DATA } from '@/data/mockData';
import { SoloQPlayer } from '@/types/soloq';
import { toast } from 'sonner';

export function useSoloQData() {
    const [players, setPlayers] = useState<SoloQPlayer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Simulate initial fetch
        const timer = setTimeout(() => {
            setPlayers(SOLOQ_DEMO_DATA);
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const refreshData = async () => {
        setIsRefreshing(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Randomize LP slightly to show "live" updates
        const updatedPlayers = SOLOQ_DEMO_DATA.map(p => ({
            ...p,
            leaguePoints: p.leaguePoints + Math.floor(Math.random() * 20) - 10,
            lastUpdated: Date.now()
        }));

        setPlayers(updatedPlayers);
        setIsRefreshing(false);
        toast.success("SoloQ data updated successfully");
    };

    return {
        players,
        isLoading,
        isRefreshing,
        refreshData
    };
}
