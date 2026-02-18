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
        <div className="w-full mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">User Management</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">View and manage bot users.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    >
                        <option value="all">All Users</option>
                        <option value="active">Active Only</option>
                        <option value="blocked">Blocked Only</option>
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            className="pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300">User</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300">Username</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300">Status</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300">Telegram ID</th>
                                <th className="px-6 py-4 font-semibold text-zinc-700 dark:text-zinc-300">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.telegramId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                                                    {user.firstName[0]}
                                                </div>
                                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                            {user.username ? `@${user.username}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isBlocked
                                                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {user.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                                            {user.telegramId}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-500">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                        Showing {filteredUsers.length} users
                    </span>
                </div>
            </div>
        </div>
    );
}
