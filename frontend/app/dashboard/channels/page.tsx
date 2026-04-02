"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, Plus, ToggleLeft, ToggleRight, Radio } from "lucide-react";

interface Channel {
    _id: string;
    chatId: string;
    name: string;
    active: boolean;
}

export default function ChannelsPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [newChannel, setNewChannel] = useState({ chatId: "", name: "" });
    const [showForm, setShowForm] = useState(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const fetchChannels = async () => {
        try {
            const res = await axios.get(`${apiUrl}/api/channels`);
            setChannels(res.data);
        } catch (error) {
            console.error("Error fetching channels:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${apiUrl}/api/channels`, newChannel);
            setNewChannel({ chatId: "", name: "" });
            setShowForm(false);
            fetchChannels();
        } catch (error) {
            console.error("Error adding channel:", error);
            alert("Failed to add channel (Ensure Chat ID is unique)");
        }
    };

    const toggleChannel = async (id: string) => {
        try {
            await axios.put(`${apiUrl}/api/channels/${id}/toggle`);
            fetchChannels();
        } catch (error) {
            console.error("Error toggling channel:", error);
        }
    };

    const deleteChannel = async (id: string) => {
        if (!confirm("Are you sure? This will delete the channel configuration.")) return;
        try {
            await axios.delete(`${apiUrl}/api/channels/${id}`);
            fetchChannels();
        } catch (error) {
            console.error("Error deleting channel:", error);
        }
    };

    return (
        <div className="p-8 sm:p-12 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Signal Hub</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Broadcast Channel Configuration</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-slate-900 text-white rounded-[20px] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} />
                    <span>Deploy New Signal</span>
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-8 rounded-[32px] shadow-2xl shadow-slate-900/[0.03] border border-slate-100 mb-10 animate-in slide-in-from-top-6 duration-500">
                    <div className="flex items-center gap-3 mb-8">
                         <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                            <Radio size={20} strokeWidth={2.5} />
                         </div>
                         <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Provision Signal</h2>
                    </div>
                    <form onSubmit={handleAddChannel} className="flex flex-col gap-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="w-full">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">
                                    Display Identity / चैनल का नाम
                                </label>
                                <input
                                    type="text"
                                    value={newChannel.name}
                                    onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                    className="w-full px-6 py-4 border border-slate-100 rounded-3xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-black text-slate-900 placeholder:font-medium placeholder:text-slate-300 shadow-inner"
                                    placeholder="Secure Signal Alpha"
                                    required
                                />
                            </div>
                            <div className="w-full">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">
                                    Telegram Endpoint / चैट आईडी
                                </label>
                                <input
                                    type="text"
                                    value={newChannel.chatId}
                                    onChange={(e) => setNewChannel({ ...newChannel, chatId: e.target.value })}
                                    className="w-full px-6 py-4 border border-slate-100 rounded-3xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono text-[13px] font-bold text-slate-500 shadow-inner"
                                    placeholder="-100XXXXXXXXXXXXXXXX"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 border-t border-slate-50 pt-8">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-8 py-4 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
                            >
                                Discard
                            </button>
                            <button
                                type="submit"
                                className="bg-slate-900 hover:bg-emerald-600 text-white px-10 py-4 rounded-[20px] font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                Deploy Configuration
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-900/[0.02] border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Endpoint Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Cloud Address</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Logic Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-right">Ops</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 animate-pulse">
                                            <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syncing with Mainframe...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : channels.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                         <div className="flex flex-col items-center gap-4 opacity-30">
                                            <Radio size={48} strokeWidth={1} className="text-slate-300" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">No Signal Nodes Detected</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                channels.map((channel) => (
                                    <tr key={channel._id} className="hover:bg-slate-50/50 transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner transition-all group-hover:scale-110 ${channel.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    <Radio size={16} strokeWidth={2.5} className={channel.active ? 'animate-pulse' : ''} />
                                                </div>
                                                <span className="text-[15px] font-black text-slate-900 tracking-tight transition-colors group-hover:text-blue-600">{channel.name}</span>
                                            </div>
                                        </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl w-fit border border-slate-100 shadow-inner">
                                            <span className="text-[12px] text-slate-400 font-mono font-bold tracking-tight">{channel.chatId}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <button
                                            onClick={() => toggleChannel(channel._id)}
                                            className={`flex items-center gap-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${channel.active
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                                                    : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"
                                                }`}
                                        >
                                            {channel.active ? (
                                                <><ToggleRight size={18} strokeWidth={2.5} /> Active</>
                                            ) : (
                                                <><ToggleLeft size={18} strokeWidth={2.5} /> Disabled</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => deleteChannel(channel._id)}
                                            className="text-slate-300 hover:text-rose-600 p-3 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 group/del"
                                            title="Purge Signal Node"
                                        >
                                            <Trash2 size={20} strokeWidth={2} className="transition-transform group-hover/del:scale-110" />
                                        </button>
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
