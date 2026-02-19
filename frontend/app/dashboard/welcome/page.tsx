'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

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
        <div className="w-full max-w-4xl mx-auto pb-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Welcome Message</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">Configure the automatic message sent to new users.</p>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8">
                {/* Welcome Message Text */}
                <div className="mb-8">
                    <label htmlFor="welcomeMessage" className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                        Message Text
                    </label>
                    <textarea
                        id="welcomeMessage"
                        className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-48 leading-relaxed mb-2"
                        placeholder="Enter the welcome message sent to new users..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Supports standard text.
                    </p>
                </div>



                {/* Inline Buttons */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Inline Buttons
                        </label>
                        <button
                            type="button"
                            onClick={handleAddButton}
                            className="text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-1"
                        >
                            + Add Button
                        </button>
                    </div>

                    <div className="space-y-3">
                        {buttons.length === 0 && (
                            <div className="text-center py-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-sm">
                                No buttons added yet.
                            </div>
                        )}
                        {buttons.map((btn, index) => (
                            <div key={index} className="flex gap-3 items-center group">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Label"
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                        value={btn.text}
                                        onChange={(e) => handleButtonChange(index, 'text', e.target.value)}
                                    />
                                </div>
                                <div className="flex-[2]">
                                    <input
                                        type="text"
                                        placeholder="URL (https://...)"
                                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-sm"
                                        value={btn.url}
                                        onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveButton(index)}
                                    className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove Button"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                        className={`bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                </div>

                {status && (
                    <div className={`mt-6 p-4 rounded-xl flex items-center text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-300 ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {status.text}
                    </div>
                )}
            </div>
        </div>
    );
}
