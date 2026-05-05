import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { featureExpansionApi } from '../services/featureExpansionApi';
import { formatCurrency } from '../services/currencyService';
import styles from './CashflowCalendarPage.module.css';

const CashflowCalendarPage = () => {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const load = async () => {
        setLoading(true);
        try {
            setEvents(await featureExpansionApi.cashflowCalendar());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    // Calendar logic
    const monthData = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const prevMonthDays = new Date(year, month, 0).getDate();
        const days: Array<{day: number, month: string, date: Date}> = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, month: 'prev', date: new Date(year, month - 1, prevMonthDays - i) });
        }
        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ day: i, month: 'current', date: new Date(year, month, i) });
        }
        // Next month padding
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, month: 'next', date: new Date(year, month + 1, i) });
        }
        return days;
    }, [currentDate]);

    const grouped = useMemo(() => events.reduce((acc, event) => {
        const key = String(event.date || '').slice(0, 10);
        acc[key] = [...(acc[key] || []), event];
        return acc;
    }, {} as Record<string, any[]>), [events]);

    // Stats
    const stats = useMemo(() => {
        const income = events.filter(e => e.type === 'income').reduce((sum, e) => sum + (e.amount || 0), 0);
        const expense = events.filter(e => e.type === 'expense' || e.type === 'bill').reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
        return { income, expense, net: income - expense };
    }, [events]);

    const getHeatmapClass = (dateStr: string) => {
        const dayEvents = grouped[dateStr] || [];
        const dailySpend = dayEvents.filter(e => e.type === 'expense' || e.type === 'bill').reduce((sum, e) => sum + Math.abs(e.amount), 0);
        if (dailySpend > 500) return styles.intensity5;
        if (dailySpend > 200) return styles.intensity4;
        if (dailySpend > 100) return styles.intensity3;
        if (dailySpend > 50) return styles.intensity2;
        if (dailySpend > 0) return styles.intensity1;
        return '';
    };

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleSection}>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 border-4 border-black bg-rose-600 text-white flex items-center justify-center shadow-[4px_4px_0px_#000000]">
                            <CalendarDays size={32} />
                        </div>
                        <div>
                            <h1>{currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}</h1>
                            <p>Cashflow Forecast & Heatmap</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={prevMonth} className={styles.refreshBtn}><ChevronLeft size={24} /></button>
                    <button onClick={nextMonth} className={styles.refreshBtn}><ChevronRight size={24} /></button>
                    <button onClick={load} className={styles.refreshBtn}><RefreshCw size={24} /></button>
                </div>
            </header>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Total Forecast Inflow</span>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" size={24} />
                        <span className={styles.statValue}>{formatCurrency(stats.income)}</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Projected Burn</span>
                    <div className="flex items-center gap-2">
                        <TrendingDown className="text-rose-500" size={24} />
                        <span className={styles.statValue}>{formatCurrency(stats.expense)}</span>
                    </div>
                </div>
                <div className={styles.statCard} style={{ background: '#000000' }}>
                    <span className={styles.statLabel} style={{ color: '#94a3b8' }}>Net Forecast</span>
                    <div className="flex items-center gap-2">
                        <Target className="text-white" size={24} />
                        <span className={styles.statValue} style={{ color: '#FFFFFF' }}>{formatCurrency(stats.net)}</span>
                    </div>
                </div>
            </div>

            <div className={styles.calendarWrapper}>
                <div className={styles.calendarHeader}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className={styles.dayLabel}>{d}</div>
                    ))}
                </div>
                <div className={styles.grid}>
                    {monthData.map((d, i) => {
                        const dateStr = d.date.toISOString().split('T')[0];
                        const dayEvents = grouped[dateStr] || [];
                        const isToday = new Date().toISOString().split('T')[0] === dateStr;
                        
                        return (
                            <div 
                                key={i} 
                                className={`${styles.cell} ${d.month !== 'current' ? 'opacity-30' : ''} ${isToday ? styles.cellToday : ''} ${getHeatmapClass(dateStr)}`}
                            >
                                <span className={styles.dateNumber}>{d.day}</span>
                                <div className={styles.eventList}>
                                    {dayEvents.map(e => (
                                        <div 
                                            key={e.id} 
                                            className={`${styles.eventItem} ${e.type === 'income' ? styles.eventIncome : e.type === 'bill' ? styles.eventBill : styles.eventExpense}`}
                                            title={`${e.title}: ${formatCurrency(e.amount)}`}
                                        >
                                            {e.type === 'bill' ? '📌 ' : ''}{e.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black text-white px-8 py-4 font-black uppercase tracking-widest border-4 border-rose-600 shadow-[8px_8px_0px_#000000]">
                        Syncing Timeline...
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashflowCalendarPage;

