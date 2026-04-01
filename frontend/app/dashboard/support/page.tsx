'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LifeBuoy, CheckCircle, Trash2, Search, Filter, MessageSquare, Smartphone, Hash, Send, ImageIcon, Video, FileAudio, X, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupportTicket {
    _id: string;
    telegramId: string;
    name: string;
    phoneNumber: string;
    dafabetId: string;
    issueType: string;
    problem: string;
    status: 'open' | 'resolved';
    unreadCount: number;
    updatedAt: string;
    createdAt: string;
}

interface ChatMessage {
    _id: string;
    sender: 'user' | 'admin';
    content: string;
    messageType: string;
    mediaUrl?: string;
    createdAt: string;
}

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('open');
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    
    // Admin Role State
    const [adminRole, setAdminRole] = useState<string>('admin');
    const [permissions, setPermissions] = useState<string[]>([]);
    
    // Notification logic
    const lastTicketsRef = useRef<SupportTicket[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('bot_admin_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setAdminRole(payload.role);
                setPermissions(payload.permissions || []);
            } catch (e) { }
        }
    }, []);

    // Auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchTickets = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/support/tickets`);
            const newTickets = response.data;

            // Check for notifications
            if (lastTicketsRef.current.length > 0) {
                const hadNewTicket = newTickets.length > lastTicketsRef.current.length;
                const hadNewUnread = newTickets.some((nt: SupportTicket) => {
                    const oldT = lastTicketsRef.current.find(ot => ot._id === nt._id);
                    return oldT && nt.unreadCount > oldT.unreadCount;
                });

                if (hadNewTicket || hadNewUnread) {
                    playNotificationSound();
                    if (hadNewTicket) toast.success('New support ticket received!');
                }
            }

            setTickets(newTickets);
            lastTicketsRef.current = newTickets;
            
            // Auto close selected ticket if deleted or resolved (optional depending on UX preference)
            if (selectedTicket && !newTickets.find((t: any) => t._id === selectedTicket._id)) {
                setSelectedTicket(null);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Polling tickets every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async (ticketId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/support/tickets/${ticketId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Poll messages if a ticket is selected
    useEffect(() => {
        if (!selectedTicket) return;
        fetchMessages(selectedTicket._id);
        const interval = setInterval(() => fetchMessages(selectedTicket._id), 3000); // Poll chat every 3s
        return () => clearInterval(interval);
    }, [selectedTicket]);

    const handleResolve = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/support/tickets/${id}/resolve`);
            toast.success('Ticket marked as resolved');
            fetchTickets();
            if (selectedTicket?._id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
            }
        } catch (error) {
            toast.error('Failed to resolve ticket');
        }
    };

    const handleReopen = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/support/tickets/${id}/reopen`);
            toast.success('Ticket reopened');
            fetchTickets();
            if (selectedTicket?._id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null);
            }
        } catch (error) {
            toast.error('Failed to reopen ticket');
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.delete(`${apiUrl}/api/support/tickets/${id}`);
            toast.success('Ticket deleted');
            if (selectedTicket?._id === id) setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            toast.error('Failed to delete ticket');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || (!newMessage.trim())) return;

        setIsSending(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/support/tickets/${selectedTicket._id}/messages`, {
                content: newMessage,
                messageType: 'text'
            });
            setNewMessage('');
            fetchMessages(selectedTicket._id);
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setIsSending(false);
            // Reset textarea height after sending
            const textarea = document.querySelector('textarea');
            if (textarea) textarea.style.height = '44px';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as unknown as React.FormEvent);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTicket) return;

        setUploadingMedia(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const uploadRes = await axios.post(`${apiUrl}/api/upload`, formData);
            const mediaUrl = uploadRes.data.url;

            await axios.post(`${apiUrl}/api/support/tickets/${selectedTicket._id}/messages`, {
                content: '',
                messageType: type,
                mediaUrl: mediaUrl
            });
            fetchMessages(selectedTicket._id);
        } catch (error) {
            toast.error('Failed to upload media');
        } finally {
            setUploadingMedia(false);
        }
    };

    const filteredTickets = tickets
        .filter(ticket => {
            const matchesSearch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.phoneNumber.includes(searchTerm) ||
                ticket.dafabetId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = filterType === 'all' || ticket.issueType === filterType;
            const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
            const matchesUnread = !showOnlyUnread || ticket.unreadCount > 0;
            return matchesSearch && matchesType && matchesStatus && matchesUnread;
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const totalUnread = tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0);

    const canSeeDepositWithdraw = adminRole === 'superadmin' || permissions.includes('deposit_withdraw');
    const canSeeIdOther = adminRole === 'superadmin' || permissions.includes('id_other');

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
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm font-bold dark:text-white">Support Tickets</h1>
                        {totalUnread > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                {totalUnread} New
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
                {/* Left Side: Tickets List */}
                <div className={`w-full md:w-[320px] lg:w-[350px] shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search Name, Phone, ID..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="all">All Types</option>
                                {canSeeDepositWithdraw && <option value="Withdrawal">Withdrawal</option>}
                                {canSeeDepositWithdraw && <option value="Deposit">Deposit</option>}
                                {canSeeIdOther && <option value="ID">ID Issue</option>}
                                {canSeeIdOther && <option value="Other">Other</option>}
                            </select>
                            <button
                                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                                    showOnlyUnread 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                                }`}
                            >
                                Unread
                            </button>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-[100px] bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="open">Open</option>
                                <option value="resolved">Resolved</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {loading ? (
                            <div className="text-center text-zinc-500 text-sm py-10">Loading tickets...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center text-zinc-500 text-sm py-10">No tickets found.</div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    onClick={() => {
                                        setSelectedTicket(ticket);
                                        // Reset unread count locally for instant feedback
                                        setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, unreadCount: 0 } : t));
                                        lastTicketsRef.current = lastTicketsRef.current.map(t => t._id === ticket._id ? { ...t, unreadCount: 0 } : t);
                                    }}
                                    className={`p-4 cursor-pointer transition-all border-b last:border-0 relative group ${
                                        selectedTicket?._id === ticket._id 
                                            ? 'bg-blue-600/10 dark:bg-blue-600/10 border-blue-500/50' 
                                            : 'bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 border-zinc-100 dark:border-zinc-800/50'
                                    } ${ticket.unreadCount > 0 ? 'ring-1 ring-blue-500/30' : ''}`}
                                >
                                    {ticket.unreadCount > 0 && (
                                        <div className="absolute top-4 right-4 w-5 h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-blue-600/40 z-10">
                                            {ticket.unreadCount}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className={`font-bold text-[14px] truncate pr-4 transition-colors ${ticket.unreadCount > 0 ? 'text-blue-500' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-blue-400'}`}>
                                            {ticket.name}
                                        </div>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-tighter ${
                                            ticket.status === 'resolved' ? 'bg-zinc-800 text-zinc-500' : 
                                            ticket.issueType === 'Deposit' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            ticket.issueType === 'Withdrawal' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                            'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                                        }`}>
                                            {ticket.issueType}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-medium italic opacity-70">
                                            <Hash size={10} className="text-blue-500" /> {ticket.dafabetId}
                                        </div>
                                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                                            <Smartphone size={10} /> {ticket.phoneNumber}
                                        </div>
                                        <div className={`text-[12px] line-clamp-2 mt-2 leading-relaxed h-8 transition-colors ${ticket.unreadCount > 0 ? 'text-zinc-200 font-semibold' : 'text-zinc-500 dark:text-zinc-400 underline-offset-4 decoration-zinc-800'}`}>
                                            {ticket.problem}
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[9px] font-mono text-zinc-500">
                                            {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </span>
                                        {ticket.status === 'open' && (
                                            <div className="flex gap-1">
                                                <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping"></div>
                                                <span className="text-[9px] uppercase font-bold text-blue-500">Active</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Chat Area */}
                <div className={`flex-1 flex-col bg-[#efefef] dark:bg-[#121212] min-w-0 relative ${selectedTicket ? 'flex' : 'hidden md:flex'}`}>
                    {!selectedTicket ? (
                        <>
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-zinc-900 pointer-events-none"></div>
                            <div className="flex flex-col items-center z-10 opacity-60">
                                <MessageSquare size={48} className="text-zinc-600 mb-4" />
                                <h2 className="text-xl font-bold text-zinc-400">Select a Ticket</h2>
                                <p className="text-sm text-zinc-500 mt-2">Choose a ticket from the left to start chatting</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                            
                            {/* Chat Header */}
                            <div className="h-14 p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex justify-between items-center z-10 shadow-sm shadow-black/5">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <button 
                                        onClick={() => setSelectedTicket(null)}
                                        className="md:hidden p-1.5 -ml-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[12px] shrink-0">
                                        {(selectedTicket.name || 'U').charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-[13px] dark:text-white leading-tight flex items-center gap-1">
                                            {selectedTicket.status === 'open' ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : <div className="w-2 h-2 rounded-full bg-red-500"></div>}
                                            {selectedTicket.name}
                                        </h2>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">ID: {selectedTicket.dafabetId} • {selectedTicket.issueType}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedTicket.status === 'open' && (
                                        <button 
                                            onClick={() => handleResolve(selectedTicket._id)} 
                                            className="text-[11px] text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 px-3 py-1.5 rounded-md font-bold transition-colors" 
                                            title="End Chat & Resolve Ticket"
                                        >
                                            End Chat
                                        </button>
                                    )}
                                    {selectedTicket.status === 'resolved' && (
                                        <button 
                                            onClick={() => handleReopen(selectedTicket._id)} 
                                            className="text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-md font-bold transition-colors" 
                                            title="Reopen Ticket"
                                        >
                                            Reopen
                                        </button>
                                    )}
                                    {adminRole === 'superadmin' && (
                                        <button onClick={() => handleDelete(selectedTicket._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete Ticket">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedTicket(null)} className="hidden">
                                    </button>
                                </div>
                            </div>
                            
                            {/* Original Problem Banner */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 p-3 shrink-0 z-10 mx-2 mt-2 rounded-lg">
                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase tracking-wider">Initial User Problem</p>
                                <p className="text-[13px] text-blue-900 dark:text-blue-100 font-medium">{selectedTicket.problem}</p>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 relative custom-scrollbar">
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    return (
                                        <div key={msg._id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2 relative shadow-sm ${isAdmin ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-gray-100 rounded-lg rounded-tr-none' : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-lg rounded-tl-none border border-black/5 dark:border-transparent'}`}>
                                                {msg.mediaUrl ? (
                                                    <div className="mb-1">
                                                        {msg.messageType === 'photo' ? (
                                                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block"><img src={msg.mediaUrl} alt="Shared photo" className="max-w-full max-h-[250px] rounded-md object-contain" /></a>
                                                        ) : msg.messageType === 'video' ? (
                                                            <video src={msg.mediaUrl} controls className="max-w-full max-h-[250px] rounded-md" />
                                                        ) : msg.messageType === 'audio' || msg.messageType === 'voice' ? (
                                                            <audio src={msg.mediaUrl} controls className="max-w-full h-10" />
                                                        ) : (
                                                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] p-2 text-blue-500 underline font-medium bg-black/5 dark:bg-white/5 rounded-lg">
                                                                📄 View Document
                                                            </a>
                                                        )}
                                                        {msg.content && <p className="text-[13px] mt-1 whitespace-pre-wrap">{msg.content}</p>}
                                                    </div>
                                                ) : (
                                                    <p className="text-[13px] whitespace-pre-wrap leading-relaxed pr-8">{msg.content}</p>
                                                )}
                                                <p className={`text-[9px] mt-1 text-right opacity-60 ${msg.mediaUrl && !msg.content ? 'relative bottom-0 right-0 inline-block w-full' : 'absolute bottom-1.5 right-2'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white dark:bg-zinc-900 shrink-0 z-10 pb-6 sm:pb-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                                {selectedTicket.status === 'resolved' ? (
                                    <div className="flex flex-col items-center justify-center py-2 gap-2">
                                        <div className="text-center text-[12px] text-zinc-400">
                                            This ticket has been resolved. Chat is closed.
                                        </div>
                                        <button 
                                            onClick={() => handleReopen(selectedTicket._id)}
                                            className="text-[12px] px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            Reopen Ticket
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto relative">
                                        <label className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer self-end mb-0.5">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'photo')} disabled={uploadingMedia} />
                                            {uploadingMedia ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ImageIcon size={18} />}
                                        </label>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder={uploadingMedia ? "Uploading media..." : "Type a message... (Shift+Enter for new line)"}
                                            disabled={uploadingMedia}
                                            rows={1}
                                            className="flex-1 px-4 py-3 rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[13px] focus:ring-1 focus:ring-blue-500/50 outline-none dark:text-white transition-all resize-none min-h-[44px] max-h-[120px] overflow-y-auto w-full custom-scrollbar leading-tight"
                                            style={{ height: '44px' }}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim() || isSending || uploadingMedia}
                                            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 text-white flex items-center justify-center transition-colors shrink-0 shadow-sm self-end mb-0.5"
                                        >
                                            <Send size={16} className="-ml-0.5" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #3f3f46;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
