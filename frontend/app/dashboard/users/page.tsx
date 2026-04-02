'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Search } from 'lucide-react';

interface UserData {
    telegramId: string;
    firstName: string;
    lastName?: string;
    username?: string;
    isBlocked?: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await axios.get(`${apiUrl}/api/users`);
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.telegramId.toString().includes(searchTerm);

        let matchesFilter = true;
        if (filterStatus === 'active') matchesFilter = !(user.isBlocked ?? false);
        if (filterStatus === 'blocked') matchesFilter = user.isBlocked ?? false;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="w-full mx-auto pb-10 bg-slate-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-slate-500 font-medium mt-1">View and manage bot users in real-time.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[13px] font-bold text-slate-600 appearance-none min-w-[140px] shadow-sm cursor-pointer"
                    >
                        <option value="all">Check Status: All</option>
                        <option value="active">Active Only</option>
                        <option value="blocked">Blocked Only</option>
                    </select>
                    <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search Name, Username, ID..."
                            className="pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-72 text-[13px] font-medium shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden shadow-indigo-500/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-[0.1em] text-[10px] border-b border-slate-100">User Details</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-[0.1em] text-[10px] border-b border-slate-100">Username</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-[0.1em] text-[10px] border-b border-slate-100 text-center">Status</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-[0.1em] text-[10px] border-b border-slate-100">Telegram ID</th>
                                <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-[0.1em] text-[10px] border-b border-slate-100 text-right">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Loading Database...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Search size={40} />
                                            <span className="text-[13px] font-bold uppercase tracking-widest text-slate-500">No matching users found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.telegramId} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[15px] shadow-sm border border-blue-100 hover:scale-105 transition-transform duration-300">
                                                    {user.firstName[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-[14px]">
                                                        {user.firstName} {user.lastName}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">Verified Member</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 font-bold text-[13px]">
                                                {user.username ? `@${user.username}` : <span className="text-slate-300 italic font-medium">None</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${user.isBlocked
                                                ? 'bg-rose-50 border-rose-100 text-rose-600'
                                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                }`}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-slate-400 font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                                {user.telegramId}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-[12px] font-bold text-slate-500">
                                                {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-5 bg-slate-50/30 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        Total Records: {filteredUsers.length} Users Found
                    </span>
                    <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Live Database</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
