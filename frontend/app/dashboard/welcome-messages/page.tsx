"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Save, AlertCircle, CheckCircle, Upload, Trash2, Radio } from "lucide-react";
import Image from "next/image";

interface Channel {
    _id: string;
    name: string;
}

interface WelcomeMessage {
    _id?: string;
    channelId: string;
    messageText: string;
    buttonText: string;
    buttonUrl: string;
    mediaUrl: string;
    delaySec: number;
    enabled: boolean;
}

export default function WelcomeMessagesPage() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<string>("");
    const [formData, setFormData] = useState<WelcomeMessage>({
        channelId: "",
        messageText: "Hello {first_name}, welcome to {channel_name}!",
        buttonText: "JOIN NOW",
        buttonUrl: "https://example.com",
        mediaUrl: "",
        delaySec: 0,
        enabled: true
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMessage(null);

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        try {
            const res = await fetch(`${apiUrl}/api/upload`, {
                method: "POST",
                body: uploadFormData,
            });
            const data = await res.json();
            if (res.ok) {
                setFormData({ ...formData, mediaUrl: data.url });
                setMessage({ type: 'success', text: 'Image uploaded successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Image upload failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error uploading image' });
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        const fetchChannels = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/channels`);
                const activeChannels = res.data.filter((c: any) => c.active);
                setChannels(activeChannels);
                if (activeChannels.length > 0) {
                    setSelectedChannel(activeChannels[0]._id);
                }
            } catch (error) {
                console.error("Error fetching channels:", error);
            }
        };
        fetchChannels();
    }, []);

    useEffect(() => {
        if (!selectedChannel) return;

        const fetchMessage = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${apiUrl}/api/welcome-messages/channel/${selectedChannel}`);
                if (res.data && res.data.channelId) {
                    setFormData(res.data);
                } else {
                    // Reset to defaults if no message exists
                    setFormData({
                        channelId: selectedChannel,
                        messageText: "Hello {first_name}, welcome to {channel_name}!",
                        buttonText: "",
                        buttonUrl: "",
                        mediaUrl: "",
                        delaySec: 0,
                        enabled: true
                    });
                }
            } catch (error) {
                console.error("Error fetching welcome message:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessage();
    }, [selectedChannel]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setLoading(true);

        try {
            await axios.post(`${apiUrl}/api/welcome-messages`, { ...formData, channelId: selectedChannel });
            setMessage({ type: 'success', text: 'Welcome message saved successfully!' });
        } catch (error) {
            console.error("Error saving welcome message:", error);
            setMessage({ type: 'error', text: 'Failed to save welcome message.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 sm:p-12 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col gap-1 mb-12">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Funnel Engine</h1>
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Automated Welcome Sequences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                {/* Channel Sidebar/Dropdown */}
                <div className="lg:col-span-1 space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Active Signal Nodes</label>
                    <div className="flex flex-col gap-2 relative">
                         {/* Sidebar Decorative Line */}
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-100 -ml-4 hidden lg:block"></div>
                        
                        {channels.length === 0 ? (
                            <div className="p-8 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                <AlertCircle size={24} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-relaxed">No active nodes found</p>
                            </div>
                        ) : (
                            channels.map((channel) => (
                                <button
                                    key={channel._id}
                                    onClick={() => setSelectedChannel(channel._id)}
                                    className={`relative z-10 text-left px-6 py-4 rounded-[24px] text-[13px] font-black uppercase tracking-widest transition-all ${selectedChannel === channel._id
                                        ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 -translate-x-1"
                                        : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-900 border border-slate-100"
                                        }`}
                                >
                                    {channel.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <div className="lg:col-span-3">
                    {selectedChannel ? (
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-900/[0.03] border border-slate-100 p-10 animate-in slide-in-from-right-8 duration-500">
                            <form onSubmit={handleSave} className="space-y-10">
                                {/* Enabled Toggle */}
                                <div className="flex items-center justify-between p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-inner group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm ${formData.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <CheckCircle size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] font-black text-slate-900 uppercase tracking-widest">Logic Gate</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {formData.enabled ? 'Active Sequence' : 'Standby Mode'}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.enabled}
                                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                    </label>
                                </div>

                                {/* Message Text */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                            Payload Text Content
                                        </label>
                                        <div className="flex gap-2 text-[9px] font-black uppercase tracking-widest text-blue-500/60 bg-blue-50 px-3 py-1 rounded-full">
                                            <span>{'{first_name}'}</span>
                                            <span>{'{channel_name}'}</span>
                                        </div>
                                    </div>
                                    <textarea
                                        rows={6}
                                        value={formData.messageText}
                                        onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
                                        className="w-full px-6 py-5 border border-slate-100 rounded-[32px] bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
                                        placeholder="Enter the welcome script..."
                                        required
                                    />
                                </div>

                                {/* Buttons & Media */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Button Call-to-Action</label>
                                        <input
                                            type="text"
                                            value={formData.buttonText}
                                            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                            className="w-full px-6 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-black text-slate-900 placeholder:text-slate-300 shadow-inner"
                                            placeholder="e.g. GET STARTED"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Redirect Endpoint URL</label>
                                        <input
                                            type="text"
                                            value={formData.buttonUrl}
                                            onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                                            className="w-full px-6 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono font-bold text-slate-500 placeholder:text-slate-300 shadow-inner"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-4">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Media Payload (Image/Video)</label>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex gap-4">
                                                <input
                                                    type="text"
                                                    value={formData.mediaUrl}
                                                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                                    className="flex-1 px-6 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono font-bold text-slate-400 text-[12px] shadow-inner"
                                                    placeholder="Remote URL or auto-populated on upload"
                                                />
                                                <label className="shrink-0 cursor-pointer flex items-center justify-center p-4 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-90">
                                                    {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Upload size={20} strokeWidth={2.5} />}
                                                    <input
                                                        type="file"
                                                        accept="image/*,video/*"
                                                        className="hidden"
                                                        onChange={handleImageUpload}
                                                        disabled={uploading}
                                                    />
                                                </label>
                                            </div>
                                            
                                            {formData.mediaUrl && (
                                                <div className="relative group w-full h-48 bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 shadow-inner mt-2">
                                                    {formData.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                                                        <video src={formData.mediaUrl} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Image
                                                            src={formData.mediaUrl}
                                                            alt="Media Preview"
                                                            fill
                                                            className="object-contain p-4"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, mediaUrl: "" })}
                                                        className="absolute top-4 right-4 p-3 bg-rose-600 text-white rounded-xl hover:scale-110 transition-all shadow-xl opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Sequence Delay (SEC)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.delaySec}
                                            onChange={(e) => setFormData({ ...formData, delaySec: parseInt(e.target.value) || 0 })}
                                            className="w-full px-6 py-4 border border-slate-100 rounded-2xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                                        />
                                    </div>
                                </div>

                                {message && (
                                    <div className={`p-6 rounded-3xl flex items-center gap-3 animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                        {message.type === 'success' ? <CheckCircle size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
                                        <span className="text-[12px] font-black uppercase tracking-widest">{message.text}</span>
                                    </div>
                                )}

                                <div className="border-t border-slate-50 pt-10">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white px-12 py-5 rounded-[24px] font-black text-[13px] uppercase tracking-[0.25em] transition-all flex justify-center items-center gap-3 shadow-2xl shadow-slate-900/10 active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? "Deploying..." : <><Save size={18} strokeWidth={2.5} /> Confirm Sequence Update</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-900/[0.02] border border-slate-100 p-24 text-center">
                             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Radio size={32} />
                             </div>
                             <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase mb-2">Select Logic Node</h3>
                             <p className="text-[12px] font-medium text-slate-400 max-w-xs mx-auto leading-relaxed">Please select a validated signal node from the sidebar to configure its automation sequence.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
