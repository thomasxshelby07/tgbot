'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Save, RefreshCcw, Star, Users } from 'lucide-react';

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
        <div className="w-full max-w-6xl mx-auto pb-20 px-1 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6 px-2">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                         <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 shadow-sm">
                            <Star className="text-amber-500 fill-amber-500 animate-pulse" size={24} />
                         </div>
                         <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">VIP CLUB</h1>
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] ml-1">Premium Membership Control & Analytics</p>
                </div>
                <button
                    onClick={handleExport}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 text-white font-black uppercase text-[12px] tracking-widest py-4 px-8 rounded-[24px] transition-all shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 shadow-slate-900/10"
                >
                    <Download size={18} strokeWidth={3} /> <span>Export Database</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Settings Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 shadow-indigo-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                        
                        <h2 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-2 relative z-10">
                             VIP Configuration
                        </h2>
                        
                        <div className="space-y-6 relative z-10">
                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 ml-1">
                                    Menu Label / बटन का नाम
                                </label>
                                <input
                                    type="text"
                                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-bold shadow-inner"
                                    value={settings.vipButtonText}
                                    onChange={(e) => setSettings({ ...settings, vipButtonText: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 ml-1">
                                    Registration Welcome / स्वागत संदेश
                                </label>
                                <textarea
                                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium h-32 resize-none shadow-inner leading-relaxed"
                                    value={settings.vipWelcomeMessage}
                                    onChange={(e) => setSettings({ ...settings, vipWelcomeMessage: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 ml-1">
                                    Private Channel Link / चैनल लिंक
                                </label>
                                <input
                                    type="text"
                                    placeholder="https://t.me/joinchat/..."
                                    className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 text-slate-900 placeholder-slate-300 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-mono shadow-inner"
                                    value={settings.vipChannelLink}
                                    onChange={(e) => setSettings({ ...settings, vipChannelLink: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                                <span className="text-[12px] font-black uppercase tracking-widest text-slate-600">Feature Status</span>
                                <button
                                    onClick={() => setSettings({ ...settings, vipActive: !settings.vipActive })}
                                    className={`w-14 h-7 rounded-full transition-all relative ${settings.vipActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${settings.vipActive ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleSaveSettings}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-black text-white font-black text-[12px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} strokeWidth={2.5} /> {loading ? 'DEPLOYING...' : 'SAVE CONFIG'}
                            </button>

                            {status && (
                                <div className={`text-center p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest animate-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {status.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Members List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden shadow-indigo-500/5">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                <span>VIP Member Directory</span>
                                <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-blue-500/20">{members.length}</span>
                            </h2>
                            <button 
                                onClick={fetchData}
                                className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-500 hover:rotate-180 transition-all duration-500 shadow-sm"
                                title="Refresh Live Database"
                            >
                                <RefreshCcw size={18} />
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] border-b border-slate-100">Member Identity</th>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] border-b border-slate-100">Contact Number</th>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] border-b border-slate-100">Primary Interest</th>
                                        <th className="px-8 py-5 font-black text-slate-400 uppercase tracking-[0.15em] text-[10px] border-b border-slate-100 text-right">Registration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {members.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20">
                                                     <Users size={64} strokeWidth={1} />
                                                     <span className="text-[13px] font-black uppercase tracking-[0.3em]">No VIP Records Found</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        members.map((member) => (
                                            <tr key={member._id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                         <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[15px] shadow-lg group-hover:scale-110 transition-transform duration-300">
                                                            {member.name[0]}
                                                         </div>
                                                         <div className="flex flex-col">
                                                            <div className="font-bold text-slate-900 text-[14px] leading-tight">{member.name}</div>
                                                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                                                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                                ID: {member.telegramId}
                                                            </div>
                                                         </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-[13px] font-bold text-slate-600 shadow-inner">
                                                        {member.phoneNumber}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border transition-all shadow-sm ${
                                                        member.interest === 'Casino' ? 'bg-purple-50 border-purple-100 text-purple-600' :
                                                        member.interest === 'Cricket' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                        'bg-amber-50 border-amber-100 text-amber-600'
                                                    }`}>
                                                        {member.interest}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right flex flex-col items-end">
                                                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">
                                                        {new Date(member.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300">
                                                        {new Date(member.createdAt).toLocaleDateString(undefined, { year: 'numeric' })}
                                                    </span>
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
