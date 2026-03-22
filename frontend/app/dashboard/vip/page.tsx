'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Save, RefreshCcw, Star } from 'lucide-react';

interface VipMember {
    _id: string;
    telegramId: string;
    name: string;
    phoneNumber: string;
    interest: string;
    createdAt: string;
}

export default function VipManagementPage() {
    const [members, setMembers] = useState<VipMember[]>([]);
    const [settings, setSettings] = useState({
        vipButtonText: '🌟 JOIN VIP',
        vipWelcomeMessage: 'Welcome! Please enter your Name to join VIP:',
        vipChannelLink: '',
        vipActive: true
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const fetchData = async () => {
        try {
            const [membersRes, settingsRes] = await Promise.all([
                axios.get(`${apiUrl}/api/vip/members`),
                axios.get(`${apiUrl}/api/vip/settings`)
            ]);
            setMembers(membersRes.data);
            setSettings(settingsRes.data);
        } catch (error) {
            console.error('Error fetching VIP data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveSettings = async () => {
        setLoading(true);
        setStatus(null);
        try {
            await axios.patch(`${apiUrl}/api/vip/settings`, settings);
            setStatus({ type: 'success', text: 'VIP settings updated successfully!' });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        window.open(`${apiUrl}/api/vip/export`, '_blank');
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-20 px-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter flex items-center gap-3 italic underline decoration-yellow-500/50 decoration-8 underline-offset-8">
                        <Star className="text-yellow-500 fill-yellow-500 animate-pulse" size={32} /> VIP CLUB
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-4 font-medium uppercase tracking-[0.2em] text-[10px]">Membership Control & Analytics</p>
                </div>
                <button
                    onClick={handleExport}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase text-xs tracking-widest py-4 px-8 rounded-2xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 border-b-4 border-zinc-700 dark:border-zinc-200"
                >
                    <Download size={18} className="stroke-[3]" /> Export Excel
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">VIP Settings</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Menu Button Text
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    value={settings.vipButtonText}
                                    onChange={(e) => setSettings({ ...settings, vipButtonText: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Welcome Message
                                </label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm h-32 resize-none"
                                    value={settings.vipWelcomeMessage}
                                    onChange={(e) => setSettings({ ...settings, vipWelcomeMessage: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                    Channel Link
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://t.me/..."
                                    className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-mono"
                                    value={settings.vipChannelLink}
                                    onChange={(e) => setSettings({ ...settings, vipChannelLink: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Feature Active</span>
                                <button
                                    onClick={() => setSettings({ ...settings, vipActive: !settings.vipActive })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${settings.vipActive ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${settings.vipActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                <Save size={18} /> {loading ? 'Saving...' : 'Save Settings'}
                            </button>

                            {status && (
                                <div className={`text-center p-3 rounded-xl text-xs font-medium ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                    {status.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Registered Members</h2>
                            <button 
                                onClick={fetchData}
                                className="p-2 text-zinc-500 hover:text-blue-500 transition-colors"
                                title="Refresh List"
                            >
                                <RefreshCcw size={18} />
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Number</th>
                                        <th className="px-6 py-4">Interest</th>
                                        <th className="px-6 py-4 text-right">Joined Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                    {members.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-zinc-500 italic">
                                                No VIP members registered yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        members.map((member) => (
                                            <tr key={member._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{member.name}</div>
                                                    <div className="text-xs text-zinc-500 font-mono">{member.telegramId}</div>
                                                </td>
                                                <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 text-sm">
                                                    {member.phoneNumber}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                        member.interest === 'Casino' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                                                        member.interest === 'Cricket' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                                                        'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                                    }`}>
                                                        {member.interest}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-zinc-500 text-xs">
                                                    {new Date(member.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
