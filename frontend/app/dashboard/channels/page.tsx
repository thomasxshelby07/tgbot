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
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Channel Management</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} />
                    Add Channel
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6 animate-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-100">Add New Channel</h2>
                    <form onSubmit={handleAddChannel} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Channel Name
                            </label>
                            <input
                                type="text"
                                value={newChannel.name}
                                onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g. Cricket Updates"
                                required
                            />
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Chat ID (starts with -100)
                            </label>
                            <input
                                type="text"
                                value={newChannel.chatId}
                                onChange={(e) => setNewChannel({ ...newChannel, chatId: e.target.value })}
                                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="-1001234567890"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
                        >
                            Save
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Chat ID</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-zinc-500">Loading channels...</td>
                            </tr>
                        ) : channels.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-zinc-500">No channels added yet.</td>
                            </tr>
                        ) : (
                            channels.map((channel) => (
                                <tr key={channel._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{channel.name}</td>
                                    <td className="px-6 py-4 text-sm text-zinc-500 font-mono">{channel.chatId}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleChannel(channel._id)}
                                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${channel.active
                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                }`}
                                        >
                                            {channel.active ? (
                                                <><ToggleRight size={16} /> Active</>
                                            ) : (
                                                <><ToggleLeft size={16} /> Inactive</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => deleteChannel(channel._id)}
                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete Channel"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
