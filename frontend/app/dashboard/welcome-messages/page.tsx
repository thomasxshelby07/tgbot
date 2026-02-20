"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

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
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6">Welcome Message Configuration</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Channel Sidebar/Dropdown */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Select Channel</label>
                    <div className="flex flex-col gap-2">
                        {channels.length === 0 ? (
                            <p className="text-sm text-zinc-500">No active channels found.</p>
                        ) : (
                            channels.map((channel) => (
                                <button
                                    key={channel._id}
                                    onClick={() => setSelectedChannel(channel._id)}
                                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedChannel === channel._id
                                            ? "bg-blue-600 text-white shadow-md"
                                            : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                                        }`}
                                >
                                    {channel.name}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Edit Form */}
                <div className="md:col-span-3">
                    {selectedChannel ? (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                            <form onSubmit={handleSave} className="space-y-6">
                                {/* Enabled Toggle */}
                                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Enable Welcome Message</h3>
                                        <p className="text-xs text-zinc-500">Toggle this funnel for the selected channel</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.enabled}
                                            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Message Text */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Message Text
                                        <span className="text-xs font-normal text-zinc-500 ml-2">(Variables: {'{first_name}'}, {'{channel_name}'})</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={formData.messageText}
                                        onChange={(e) => setFormData({ ...formData, messageText: e.target.value })}
                                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                {/* Buttons & Media */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Button Text (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.buttonText}
                                            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="JOIN NOW"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Button URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.buttonUrl}
                                            onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })}
                                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Media URL (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.mediaUrl}
                                            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://... (Image/Video)"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Delay (seconds)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.delaySec}
                                            onChange={(e) => setFormData({ ...formData, delaySec: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {message && (
                                    <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                        <span className="text-sm font-medium">{message.text}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
                                >
                                    {loading ? "Saving..." : <><Save size={18} /> Save Settings</>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-500">
                            <p>Please select a channel to configure its welcome message.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
