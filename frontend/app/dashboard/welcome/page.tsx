'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';

export default function WelcomeMessagePage() {
    const [message, setMessage] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [buttons, setButtons] = useState<{ text: string; url: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const response = await axios.get(`${apiUrl}/api/settings/welcome`);
                setMessage(response.data.message);
                setMediaUrl(response.data.mediaUrl || '');
                setButtons(response.data.buttons);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleAddButton = () => {
        setButtons([...buttons, { text: '', url: '' }]);
    };

    const handleRemoveButton = (index: number) => {
        const newButtons = buttons.filter((_, i) => i !== index);
        setButtons(newButtons);
    };

    const handleButtonChange = (index: number, field: 'text' | 'url', value: string) => {
        const newButtons = [...buttons];
        newButtons[index][field] = value;
        setButtons(newButtons);
    };


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        setLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMediaUrl(res.data.url);
            setStatus({ type: 'success', text: 'Image uploaded successfully!' });
        } catch (error) {
            console.error('Upload failed:', error);
            setStatus({ type: 'error', text: 'Image upload failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/settings/welcome`, {
                message,
                mediaUrl,
                buttons
            });
            setStatus({ type: 'success', text: 'Welcome message updated successfully!' });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', text: 'Failed to update message.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 sm:p-12 pb-32 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6 px-1">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Greeting Matrix</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Universal Entry Protocol Configuration</p>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-900/[0.03] border border-slate-100 p-10 animate-in slide-in-from-bottom-8 duration-500">
                {/* Welcome Message Text */}
                <div className="mb-12">
                    <label htmlFor="welcomeMessage" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">
                        Payload Script / स्वागत संदेश
                    </label>
                    <textarea
                        id="welcomeMessage"
                        className="w-full px-8 py-6 rounded-[32px] border border-slate-100 bg-slate-50 text-slate-900 placeholder-slate-300 focus:bg-white focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all resize-none h-56 font-bold text-[15px] leading-relaxed shadow-inner"
                        placeholder="Enter the automated greeting sequence..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <div className="flex items-center gap-2 mt-4 px-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                         <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mainframe deployment active on update</p>
                    </div>
                </div>

                {/* Inline Buttons */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Interactive Call-to-Action Nodes
                        </label>
                        <button
                            type="button"
                            onClick={handleAddButton}
                            className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90"
                        >
                            + Provision Node
                        </button>
                    </div>

                    <div className="space-y-4">
                        {buttons.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <Trash2 size={24} className="text-slate-200" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No active response nodes</p>
                            </div>
                        )}
                        {buttons.map((btn, index) => (
                            <div key={index} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-6 bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-inner relative group animate-in zoom-in-95 duration-200">
                                <div className="flex-1 w-full">
                                    <label className="block text-[9px] uppercase font-black tracking-widest text-slate-300 mb-2 ml-1">Display Label</label>
                                    <input
                                        type="text"
                                        placeholder="Button Display Name"
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-[14px] font-black shadow-sm"
                                        value={btn.text}
                                        onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                                    />
                                </div>
                                <div className="flex-[2] w-full">
                                    <label className="block text-[9px] uppercase font-black tracking-widest text-slate-300 mb-2 ml-1">Redirect Endpoint</label>
                                    <input
                                        type="text"
                                        placeholder="https://..."
                                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono font-bold text-[12px] shadow-sm"
                                        value={btn.url}
                                        onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveButton(index)}
                                    className="p-4 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all self-end sm:self-center border border-transparent hover:border-rose-100"
                                    title="Decomission Node"
                                >
                                    <Trash2 size={20} strokeWidth={2} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-10 border-t border-slate-50">
                    <div className="hidden sm:block">
                        {status && (
                            <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
                                <span className="text-[11px] font-black uppercase tracking-widest">{status.text}</span>
                            </div>
                        )}
                    </div>
                    <button
                        className={`w-full sm:w-auto bg-slate-900 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 px-12 rounded-[24px] shadow-2xl shadow-slate-900/10 transition-all active:scale-95 disabled:opacity-50 ${loading ? 'cursor-wait' : ''}`}
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Processing Logic...' : 'Deploy Protocol Sync'}
                    </button>
                </div>

                {/* Mobile status view */}
                {status && (
                    <div className="sm:hidden mt-6 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-center animate-in zoom-in-95">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${status.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>{status.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
