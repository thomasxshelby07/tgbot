'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Hash, X, Search, ArrowLeft, Settings as SettingsIcon, PlusCircle, Trash2, Filter, ImageIcon, Loader2 } from 'lucide-react';
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
    unreadCount?: number;
    updatedAt: string;
}

interface ChatMessage {
    _id: string;
    sessionId: string;
    sender: 'user' | 'admin';
    content: string;
    messageType: string;
    createdAt: string;
    mediaUrl?: string;
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modals state
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'closed'>('all');

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
            setSettings({
                chatButtonText: response.data?.chatButtonText || '💬 Live Chat',
                chatActive: response.data?.chatActive ?? true
            });
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

    const fetchAllUsers = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/users`);
            setAllUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users for new chat');
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
        if (isAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isAutoScroll]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isBottom = scrollHeight - scrollTop - clientHeight < 150;
        setIsAutoScroll(isBottom);
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/chat/settings`, settings);
            toast.success('Chat settings updated');
            setIsSettingsModalOpen(false);
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
            setIsAutoScroll(true);
            fetchMessages(selectedSession._id); // instant refresh
            fetchSessions(false); // update last modified sorting
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSession) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const uploadRes = await axios.post(`${apiUrl}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const mediaUrl = uploadRes.data.url;
            
            await axios.post(`${apiUrl}/api/chat/sessions/${selectedSession._id}/messages`, {
                content: '', // Optional caption could be added here
                messageType: 'photo',
                mediaUrl: mediaUrl
            });
            
            setIsAutoScroll(true);
            fetchMessages(selectedSession._id);
            fetchSessions(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to send image');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStartNewChat = async (user: any) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/chat/sessions`, {
                telegramId: user.telegramId,
                userId: user._id
            });
            setSelectedSession(res.data);
            setIsNewChatModalOpen(false);
            setUserSearchTerm('');
            toast.success('Chat session started');
            fetchSessions(false);
        } catch (err) {
            console.error('Error starting new chat:', err);
            toast.error('Failed to start new chat');
        }
    };

    const handleEndChat = async () => {
        if (!selectedSession || !confirm('End this chat session?')) return;
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

    const handleDeleteChat = async () => {
        if (!selectedSession || !confirm('Are you sure you want to delete this session AND all messages? This cannot be undone.')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.delete(`${apiUrl}/api/chat/sessions/${selectedSession._id}`);
            toast.success('Chat deleted');
            setSelectedSession(null);
            fetchSessions(false);
        } catch (error) {
            console.error('Error deleting chat:', error);
            toast.error('Failed to delete chat');
        }
    };

    const filteredUsers = allUsers.filter(u => {
        const term = userSearchTerm.toLowerCase();
        return (u.firstName?.toLowerCase().includes(term) || u.lastName?.toLowerCase().includes(term) || u.telegramId.includes(term));
    });

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <div className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1.5 text-sm font-medium"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700"></div>
                    <h1 className="text-sm font-bold dark:text-white">Admin Live Chat</h1>
                </div>
                <div>
                    <button 
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-medium border border-zinc-200 dark:border-zinc-700"
                    >
                        <SettingsIcon size={14} /> Settings
                    </button>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="flex flex-1 min-h-0 relative">
                {/* Left Sidebar - Chat List */}
                <div className={`w-full md:w-[300px] shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
                        <span className="text-xs font-bold text-zinc-500 tracking-wider">CHATS</span>
                        <div className="flex gap-2">
                            <select 
                                value={sessionFilter} 
                                onChange={(e) => setSessionFilter(e.target.value as any)}
                                className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-1.5 rounded-lg text-[11px] font-bold outline-none border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                            </select>
                            <button 
                                onClick={() => { fetchAllUsers(); setIsNewChatModalOpen(true); }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                                title="Start New Chat"
                            >
                                <PlusCircle size={14} /> NEW
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                        {loadingSessions ? (
                            <p className="p-4 text-center text-[12px] text-zinc-400">Loading...</p>
                        ) : sessions.length === 0 ? (
                            <p className="p-4 text-center text-[12px] text-zinc-400">No chats yet.</p>
                        ) : (
                            sessions.filter(s => sessionFilter === 'all' || s.status === sessionFilter).map(session => {
                                const isSelected = selectedSession?._id === session._id;
                                const titleName = session.userId?.firstName 
                                    ? `${session.userId.firstName} ${session.userId.lastName || ''}`.trim() 
                                    : session.telegramId;
                                
                                return (
                                    <div 
                                        key={session._id}
                                        onClick={() => {
                                            setSelectedSession(session);
                                            setIsAutoScroll(true);
                                            // Optimistically clear the unread badge visually
                                            setSessions(prev => prev.map(s => s._id === session._id ? { ...s, unreadCount: 0 } : s));
                                        }}
                                        className={`p-2.5 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${
                                            isSelected 
                                                ? 'bg-blue-50 dark:bg-blue-900/20' 
                                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[14px] shrink-0">
                                            {titleName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100 truncate">
                                                    {titleName}
                                                </div>
                                                <span className="text-[10px] text-zinc-400 shrink-0 ml-2">
                                                    {new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] text-zinc-500 font-medium truncate flex items-center gap-1">
                                                    <Hash size={10}/>{session.telegramId}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {!!session.unreadCount && session.unreadCount > 0 && (
                                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                            {session.unreadCount}
                                                        </span>
                                                    )}
                                                    <span className={`w-2 h-2 rounded-full ${session.status === 'active' ? 'bg-green-500' : 'bg-red-500/50'}`}></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Area - Chat Messages */}
                <div className={`flex-1 bg-[#efefef] dark:bg-[#121212] flex-col min-w-0 relative ${selectedSession ? 'flex' : 'hidden md:flex'}`}>
                    {selectedSession ? (
                        <>
                            {/* Chat Header Background Image Overlays */}
                            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                            
                            {/* Active Chat Header */}
                            <div className="h-14 p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex justify-between items-center z-10 shadow-sm shadow-black/5">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button 
                                        onClick={() => setSelectedSession(null)}
                                        className="md:hidden p-1.5 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[12px] shrink-0">
                                        {(selectedSession.userId?.firstName || selectedSession.telegramId.toString()).charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-[13px] dark:text-white leading-tight">
                                            {selectedSession.userId?.firstName || selectedSession.telegramId}
                                        </h2>
                                        <p className="text-[11px] text-zinc-400 leading-tight">
                                            {selectedSession.status === 'active' ? 'Active Session' : 'Closed Session'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedSession.status === 'active' && (
                                        <button 
                                            onClick={handleEndChat}
                                            className="text-[11px] text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 px-3 py-1.5 rounded-md font-bold transition-colors"
                                            title="End this session"
                                        >
                                            End Chat
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleDeleteChat}
                                        className="text-red-500 hover:text-red-600 dark:text-red-400 bg-zinc-50 hover:bg-red-50 dark:bg-zinc-800 dark:hover:bg-red-900/20 p-1.5 rounded-md transition-colors"
                                        title="Delete completely"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 relative" onScroll={handleScroll}>
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    const hasMedia = msg.messageType === 'photo' && msg.mediaUrl;
                                    return (
                                        <div key={msg._id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2 relative shadow-sm ${
                                                isAdmin 
                                                    ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-lg rounded-tr-none' 
                                                    : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-lg rounded-tl-none border border-black/5 dark:border-transparent'
                                            }`}>
                                                {hasMedia ? (
                                                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
                                                        <img src={msg.mediaUrl} alt="Image" className="max-w-full max-h-[250px] rounded-md object-contain" />
                                                    </a>
                                                ) : null}
                                                {msg.content ? (
                                                    <p className={`text-[13px] whitespace-pre-wrap leading-relaxed pr-8 ${hasMedia ? 'mt-1' : ''}`}>{msg.content}</p>
                                                ) : null}
                                                <p className={`text-[9px] mt-1 text-right opacity-60 ${hasMedia && !msg.content ? 'relative bottom-0 right-0 mt-1 inline-block w-full' : 'absolute bottom-1.5 right-2'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-2" />
                            </div>

                            {/* Input Area */}
                            {selectedSession.status === 'active' ? (
                                <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 shrink-0 z-10 pb-6 sm:pb-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                                    <div className="flex items-center gap-2 max-w-4xl mx-auto relative">
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImage}
                                            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
                                        >
                                            {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                        </button>
                                        <input
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 px-4 py-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[13px] focus:ring-1 focus:ring-blue-500/50 outline-none dark:text-white transition-all"
                                            disabled={sending}
                                        />
                                        <button 
                                            type="submit"
                                            disabled={sending || !inputMessage.trim()}
                                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm"
                                        >
                                            <Send size={16} className="-ml-0.5" />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-3 bg-white dark:bg-zinc-900 shrink-0 text-center z-10 border-t border-zinc-200 dark:border-zinc-800">
                                    <p className="text-[12px] text-zinc-400">This chat session has been closed.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 z-10 bg-white/50 dark:bg-black/20">
                            <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm mb-4">
                                <Search size={24} className="opacity-50" />
                            </div>
                            <p className="text-[14px] font-medium text-zinc-600 dark:text-zinc-300">Select a chat to start messaging</p>
                            <p className="text-[12px] mt-1 opacity-70">Or click 'NEW' to start a direct message with any user.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals placed optimally */}
            
            {/* New Chat Modal */}
            {isNewChatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-zinc-200 dark:border-zinc-800">
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
                            <h3 className="font-bold text-[14px] dark:text-white">Start New Chat</h3>
                            <button onClick={() => setIsNewChatModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Search users..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[13px] outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-1 text-sm custom-scrollbar">
                            {filteredUsers.length === 0 ? (
                                <p className="text-center p-6 text-zinc-500 text-[12px]">No users found.</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <div 
                                        key={user._id}
                                        onClick={() => handleStartNewChat(user)}
                                        className="flex items-center justify-between p-2.5 border-b border-zinc-100 dark:border-zinc-800/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors rounded-lg mx-1"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold text-[12px] shrink-0">
                                                {(user.firstName || 'U').charAt(0)}
                                            </div>
                                            <div className="truncate">
                                                <div className="font-bold text-[13px] dark:text-white truncate">
                                                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User'}
                                                </div>
                                                <div className="text-[11px] text-zinc-500 truncate mt-0.5 font-medium">
                                                    #{user.telegramId}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-zinc-200 dark:border-zinc-800">
                        <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
                            <h3 className="font-bold text-[14px] dark:text-white flex items-center gap-2">
                                <SettingsIcon size={14} className="text-zinc-500" /> Chat Module Settings
                            </h3>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSettings} className="p-4 flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Bot Menu Button Text</label>
                                <input
                                    type="text"
                                    value={settings.chatButtonText}
                                    onChange={(e) => setSettings({ ...settings, chatButtonText: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[13px] outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                                <input
                                    type="checkbox"
                                    id="chatActive"
                                    checked={settings.chatActive}
                                    onChange={(e) => setSettings({ ...settings, chatActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="chatActive" className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">Live Chat Active globally</label>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[13px] transition-colors"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Custom scrollbar styling scoped just to the lists */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
