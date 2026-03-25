'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, CheckCircle, Hash, User, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserDetail {
    firstName: string;
    lastName?: string;
    username?: string;
}

interface ChatSession {
    _id: string;
    telegramId: string;
    userId?: UserDetail;
    status: 'active' | 'closed';
    updatedAt: string;
}

interface ChatMessage {
    _id: string;
    sessionId: string;
    sender: 'user' | 'admin';
    content: string;
    messageType: string;
    createdAt: string;
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [settings, setSettings] = useState({
        chatButtonText: '💬 Live Chat',
        chatActive: true
    });

    const fetchSessions = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingSessions(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/chat/sessions`);
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            if (showLoading) toast.error('Failed to fetch chat sessions');
        } finally {
            if (showLoading) setLoadingSessions(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/chat/settings`);
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching chat settings:', error);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/chat/sessions/${sessionId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    useEffect(() => {
        fetchSessions();
        fetchSettings();

        // Polling loop for sessions
        const intervalId = setInterval(() => {
            fetchSessions(false);
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!selectedSession) return;
        
        fetchMessages(selectedSession._id);

        // Polling loop for messages of selected session
        const intervalId = setInterval(() => {
            fetchMessages(selectedSession._id);
        }, 2000);

        return () => clearInterval(intervalId);
    }, [selectedSession]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/chat/settings`, settings);
            toast.success('Chat settings updated');
        } catch (error) {
            console.error('Error updating chat settings:', error);
            toast.error('Failed to update settings');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession || !inputMessage.trim()) return;

        setSending(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/chat/sessions/${selectedSession._id}/messages`, {
                content: inputMessage
            });
            setInputMessage('');
            fetchMessages(selectedSession._id); // instant refresh
            fetchSessions(false); // update last modified sorting
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleEndChat = async () => {
        if (!selectedSession || !confirm('Are you sure you want to end this chat session?')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/chat/sessions/${selectedSession._id}/messages`, {
                content: "System closing chat...",
                action: 'close'
            });
            toast.success('Chat ended');
            setSelectedSession({ ...selectedSession, status: 'closed' });
            fetchSessions(false);
        } catch (error) {
            console.error('Error ending chat:', error);
            toast.error('Failed to end chat');
        }
    };

    return (
        <div className="w-full mx-auto pb-10 space-y-6 h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Live Chat</h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-2">Chat with users directly from the dashboard.</p>
                </div>
            </div>

            {/* Chat Settings Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
                <form onSubmit={handleUpdateSettings} className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-zinc-500">Chat Button Text</label>
                            <input
                                type="text"
                                value={settings.chatButtonText}
                                onChange={(e) => setSettings({ ...settings, chatButtonText: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 w-full sm:w-auto">
                                <input
                                    type="checkbox"
                                    id="chatActive"
                                    checked={settings.chatActive}
                                    onChange={(e) => setSettings({ ...settings, chatActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="chatActive" className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Active feature</label>
                            </div>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                Save Config
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Chat Main UI */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Users List Sidebar */}
                <div className="w-full lg:w-1/3 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/20">
                        <h2 className="font-bold text-lg dark:text-white uppercase tracking-widest text-xs text-zinc-500">Recent Chats</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {loadingSessions ? (
                            <p className="p-4 text-center text-sm text-zinc-500">Loading sessions...</p>
                        ) : sessions.length === 0 ? (
                            <p className="p-4 text-center text-sm text-zinc-500">No active chats found.</p>
                        ) : (
                            sessions.map(session => {
                                const isSelected = selectedSession?._id === session._id;
                                const titleName = session.userId?.firstName 
                                    ? `${session.userId.firstName} ${session.userId.lastName || ''}`.trim() 
                                    : session.telegramId;
                                
                                return (
                                    <div 
                                        key={session._id}
                                        onClick={() => setSelectedSession(session)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                            isSelected 
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' 
                                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 border-transparent'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                {titleName}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-medium">
                                                {new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-zinc-500 flex items-center gap-1"><Hash size={12}/>{session.telegramId}</span>
                                            <span className={`px-2 ml-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                                                session.status === 'active' 
                                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
                                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                            }`}>
                                                {session.status}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Messages Area */}
                <div className="flex flex-col w-full lg:w-2/3 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    {selectedSession ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-lg dark:text-white">
                                        {selectedSession.userId?.firstName || selectedSession.telegramId}
                                    </h2>
                                    <p className="text-xs text-zinc-500 flex items-center gap-2">
                                        ID: {selectedSession.telegramId}
                                        {selectedSession.status === 'closed' && (
                                            <span className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-[9px] uppercase tracking-wide">Closed</span>
                                        )}
                                    </p>
                                </div>
                                {selectedSession.status === 'active' && (
                                    <button 
                                        onClick={handleEndChat}
                                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-4 py-2 rounded-lg font-bold transition-colors border border-red-100 dark:border-red-900/50"
                                    >
                                        End Chat
                                    </button>
                                )}
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/30 dark:bg-zinc-950/10">
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    return (
                                        <div key={msg._id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                                                isAdmin 
                                                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-500/20' 
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-none shadow-sm'
                                            }`}>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                <p className={`text-[10px] mt-1.5 text-right font-medium opacity-70`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            {selectedSession.status === 'active' ? (
                                <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                                    <div className="relative flex items-center">
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full pl-6 pr-14 py-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none dark:text-white"
                                            disabled={sending}
                                        />
                                        <button 
                                            type="submit"
                                            disabled={sending || !inputMessage.trim()}
                                            className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white rounded-lg transition-colors shadow-md"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 shrink-0 text-center">
                                    <p className="text-sm text-zinc-500 font-medium">This chat session has been closed.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-8">
                            <MessageCircle size={64} className="mb-4 opacity-50" strokeWidth={1} />
                            <p className="text-lg font-medium">Select a chat to start messaging</p>
                            <p className="text-sm text-center mt-2 opacity-70 max-w-sm">
                                Choose a conversation from the left sidebar to view messages and reply to users.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
