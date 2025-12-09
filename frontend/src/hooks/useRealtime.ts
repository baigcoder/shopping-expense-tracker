import { useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export const useRealtime = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Subscribe to INSERT events on the Transaction table
        const channel = supabase
            .channel('public:Transaction')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'Transaction',
                },
                (payload) => {
                    console.log('New transaction received:', payload);

                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ['transactions'] });
                    queryClient.invalidateQueries({ queryKey: ['analytics'] });

                    // Show notification
                    const amount = payload.new.amount;
                    const store = payload.new.storeName;
                    const formattedAmount = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                    }).format(amount);

                    toast.success(
                        `New Transaction Detected!\n${store}: ${formattedAmount}`,
                        {
                            duration: 5000,
                            position: 'top-right',
                            icon: '🔔',
                            style: {
                                background: '#333',
                                color: '#fff',
                                borderRadius: '12px',
                            },
                        }
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [queryClient]);
};
