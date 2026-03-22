'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { LifeBuoy, CheckCircle, Trash2, Search, Filter, MessageSquare, User, Smartphone, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupportTicket {
    _id: string;
    telegramId: string;
    name: string;
    phoneNumber: string;
    dafabetId: string;
    issueType: string;
    problem: string;
    status: 'open' | 'resolved';
    createdAt: string;
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('open');

    const [settings, setSettings] = useState({
        supportButtonText: '🆘 Help & Support',
        supportActive: true
    });

    const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedTickets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const fetchTickets = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/support/tickets`);
            setTickets(response.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/support/settings`);
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching support settings:', error);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchSettings();
    }, []);

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/support/settings`, settings);
            toast.success('Support settings updated');
        } catch (error) {
            console.error('Error updating support settings:', error);
            toast.error('Failed to update settings');
        }
    };

    const handleResolve = async (id: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/support/tickets/${id}/resolve`);
            toast.success('Ticket marked as resolved');
            fetchTickets();
        } catch (error) {
            console.error('Error resolving ticket:', error);
            toast.error('Failed to resolve ticket');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.delete(`${apiUrl}/api/support/tickets/${id}`);
            toast.success('Ticket deleted');
            fetchTickets();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            toast.error('Failed to delete ticket');
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.phoneNumber.includes(searchTerm) ||
            ticket.dafabetId.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || ticket.issueType === filterType;
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

        return matchesSearch && matchesType && matchesStatus;
    });

    return (
        <div className="w-full mx-auto pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Support Tickets</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage user help and support requests.</p>
                </div>
            </div>

            {/* Support Settings Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <LifeBuoy className="text-blue-500" size={20} />
                    Support Configuration
                </h2>
                <form onSubmit={handleUpdateSettings} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Support Button Text</label>
                            <input
                                type="text"
                                value={settings.supportButtonText}
                                onChange={(e) => setSettings({ ...settings, supportButtonText: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 w-full sm:w-auto">
                                <input
                                    type="checkbox"
                                    id="supportActive"
                                    checked={settings.supportActive}
                                    onChange={(e) => setSettings({ ...settings, supportActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="supportActive" className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Active</label>
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                Save Config
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Filter & Status Tabs */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 rounded-2xl w-full sm:w-fit border border-zinc-200 dark:border-zinc-800">
                    {['open', 'resolved', 'all'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                filterStatus === status 
                                ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-xl ring-1 ring-zinc-200/50 dark:ring-zinc-700/50' 
                                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-between ">
                    <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, phone or ID..."
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="pl-10 pr-8 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="all">Issue Type: All</option>
                                <option value="Withdrawal">Withdrawal</option>
                                <option value="Deposit">Deposit</option>
                                <option value="ID">ID Issue</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800">
                        Total {filteredTickets.length} Tickets
                    </div>
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                        <thead className="bg-zinc-50/50 dark:bg-zinc-950/20">
                            <tr>
                                <th className="px-8 py-5 font-bold text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">User Information</th>
                                <th className="px-8 py-5 font-bold text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">Ticket Detail</th>
                                <th className="px-8 py-5 font-bold text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 w-1/4">Issue Description</th>
                                <th className="px-8 py-5 font-bold text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">Status</th>
                                <th className="px-8 py-5 font-bold text-zinc-400 text-[10px] uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">Loading tickets...</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 font-medium">No support tickets found.</td></tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-black">
                                                        {ticket.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {ticket.name}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Smartphone size={14} className="text-zinc-400" />
                                                        {ticket.phoneNumber}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Hash size={14} className="text-zinc-400" />
                                                        {ticket.telegramId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 rounded-lg w-fit text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50">
                                                    ID: {ticket.dafabetId}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        ticket.issueType === 'Withdrawal' ? 'bg-orange-500' :
                                                        ticket.issueType === 'Deposit' ? 'bg-green-500' :
                                                        ticket.issueType === 'ID' ? 'bg-blue-500' : 'bg-zinc-500'
                                                    }`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                                        ticket.issueType === 'Withdrawal' ? 'text-orange-500' :
                                                        ticket.issueType === 'Deposit' ? 'text-green-500' :
                                                        ticket.issueType === 'ID' ? 'text-blue-500' : 'text-zinc-500'
                                                    }`}>
                                                        {ticket.issueType}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 relative">
                                            <div 
                                                className={`text-zinc-600 dark:text-zinc-400 text-[13px] bg-zinc-50 dark:bg-zinc-950/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 leading-relaxed transition-all duration-300 ${
                                                    expandedTickets[ticket._id] ? 'ring-2 ring-blue-500/10' : 'max-h-24 overflow-hidden mask-fade-bottom'
                                                }`}
                                            >
                                                {ticket.problem}
                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="text-[10px] text-zinc-400 font-medium">
                                                        {new Date(ticket.createdAt).toLocaleString()}
                                                    </span>
                                                    {ticket.problem.length > 80 && (
                                                        <button 
                                                            onClick={() => toggleExpand(ticket._id)}
                                                            className="text-[11px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-blue-500/5 transition-all"
                                                        >
                                                            {expandedTickets[ticket._id] ? 'Show Less' : 'Read More'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                                ticket.status === 'resolved' 
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {ticket.status === 'open' ? (
                                                    <button
                                                        onClick={() => handleResolve(ticket._id)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
                                                        title="Mark as Resolved"
                                                    >
                                                        <CheckCircle size={14} />
                                                        Resolve
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-xl font-bold text-xs uppercase tracking-wider opacity-60">
                                                        <CheckCircle size={14} />
                                                        Resolved
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(ticket._id)}
                                                    className="p-2.5 bg-zinc-100 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 rounded-xl transition-all"
                                                    title="Delete Ticket"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
