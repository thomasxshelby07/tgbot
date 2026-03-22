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
                <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Support Button Text</label>
                        <input
                            type="text"
                            value={settings.supportButtonText}
                            onChange={(e) => setSettings({ ...settings, supportButtonText: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="supportActive"
                                checked={settings.supportActive}
                                onChange={(e) => setSettings({ ...settings, supportActive: e.target.checked })}
                                className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="supportActive" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Active</label>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
                        >
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone or ID..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
                    >
                        <option value="all">All Issues</option>
                        <option value="Withdrawal">Withdrawal</option>
                        <option value="Deposit">Deposit</option>
                        <option value="ID">ID Issue</option>
                        <option value="Other">Other</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"
                    >
                        <option value="open">Open Only</option>
                        <option value="resolved">Resolved</option>
                        <option value="all">All Status</option>
                    </select>
                </div>
                <div className="text-xs text-zinc-500 font-medium">
                    Total: {filteredTickets.length} Tickets
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">User Details</th>
                                <th className="px-6 py-4 font-semibold">ID / Issue Type</th>
                                <th className="px-6 py-4 font-semibold w-1/3">Problem</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Loading tickets...</td></tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No support tickets found.</td></tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                                    <User size={14} className="text-zinc-400" />
                                                    {ticket.name}
                                                </div>
                                                <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                                                    <Smartphone size={14} className="text-zinc-400" />
                                                    {ticket.phoneNumber}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 mt-1">
                                                    {new Date(ticket.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded w-fit flex items-center gap-1">
                                                    <Hash size={12} className="text-zinc-400" />
                                                    {ticket.dafabetId}
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                    ticket.issueType === 'Withdrawal' ? 'text-orange-500' :
                                                    ticket.issueType === 'Deposit' ? 'text-green-500' :
                                                    ticket.issueType === 'ID' ? 'text-blue-500' : 'text-zinc-500'
                                                }`}>
                                                    {ticket.issueType}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-zinc-600 dark:text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-950/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/50 italic leading-relaxed">
                                                "{ticket.problem}"
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
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {ticket.status === 'open' && (
                                                    <button
                                                        onClick={() => handleResolve(ticket._id)}
                                                        className="p-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                                                        title="Mark as Resolved"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(ticket._id)}
                                                    className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-all"
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
