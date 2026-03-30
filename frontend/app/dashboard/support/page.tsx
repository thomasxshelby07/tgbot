'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LifeBuoy, CheckCircle, Trash2, Search, Filter, MessageSquare, Smartphone, Hash, Send, Image as ImageIcon, Video, FileAudio, X } from 'lucide-react';
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

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    
    // Admin Role State
    const [adminRole, setAdminRole] = useState<string>('admin');
    const [permissions, setPermissions] = useState<string[]>([]);

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
            setTickets(response.data);
            
            // Auto close selected ticket if deleted or resolved (optional depending on UX preference)
            if (selectedTicket && !response.data.find((t: any) => t._id === selectedTicket._id)) {
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

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.phoneNumber.includes(searchTerm) ||
            ticket.dafabetId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || ticket.issueType === filterType;
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        return matchesSearch && matchesType && matchesStatus;
    });

    const canSeeDepositWithdraw = adminRole === 'superadmin' || permissions.includes('deposit_withdraw');
    const canSeeIdOther = adminRole === 'superadmin' || permissions.includes('id_other');

    return (
        <div className="flex flex-col h-[75vh] md:h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold dark:text-white">Support Desk</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage tickets and chat with users directly.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
                {/* Left Side: Tickets List */}
                <div className="w-full md:w-[40%] lg:w-[35%] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shrink-0">
                    <div className="p-4 border-b border-zinc-800 space-y-3 shrink-0">
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
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                                        selectedTicket?._id === ticket._id 
                                            ? 'bg-blue-500/10 border-blue-500/50' 
                                            : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-white truncate pr-2">{ticket.name}</div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                            ticket.status === 'resolved' ? 'bg-zinc-800 text-zinc-400' : 
                                            ticket.issueType === 'Deposit' ? 'bg-green-500/20 text-green-400' :
                                            ticket.issueType === 'Withdrawal' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {ticket.issueType}
                                        </span>
                                    </div>
                                    <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1.5"><Hash size={12} /> ID: <span className="text-white font-mono">{ticket.dafabetId}</span></div>
                                    <div className="text-xs text-zinc-400 mb-3 flex items-center gap-1.5"><Smartphone size={12} /> {ticket.phoneNumber}</div>
                                    <div className="text-xs text-zinc-500 line-clamp-2">{ticket.problem}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Chat Area */}
                <div className={`w-full md:w-[60%] lg:w-[65%] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shrink-0 ${!selectedTicket ? 'hidden md:flex items-center justify-center relative' : ''}`}>
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
                            {/* Chat Header */}
                            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950 shrink-0">
                                <div>
                                    <h2 className="font-bold text-white flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        {selectedTicket.name}
                                    </h2>
                                    <p className="text-xs text-zinc-500 mt-0.5">Dafabet ID: {selectedTicket.dafabetId} • Issue: {selectedTicket.issueType}</p>
                                </div>
                                <div className="flex gap-2">
                                    {selectedTicket.status === 'open' && (
                                        <button onClick={() => handleResolve(selectedTicket._id)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Resolve Ticket">
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                    {adminRole === 'superadmin' && (
                                        <button onClick={() => handleDelete(selectedTicket._id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete Ticket">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Original Problem Banner */}
                            <div className="bg-blue-900/10 border-b border-blue-900/30 p-4 shrink-0">
                                <p className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider">Initial User Problem</p>
                                <p className="text-sm text-blue-100">{selectedTicket.problem}</p>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    return (
                                        <div key={msg._id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-2xl flex flex-col ${isAdmin ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'}`}>
                                                {msg.mediaUrl ? (
                                                    <div className="p-1">
                                                        {msg.messageType === 'photo' ? (
                                                            <img src={msg.mediaUrl} alt="Shared photo" className="rounded-xl w-full max-h-64 object-cover" />
                                                        ) : msg.messageType === 'video' ? (
                                                            <video src={msg.mediaUrl} controls className="rounded-xl w-full max-h-64 object-cover" />
                                                        ) : msg.messageType === 'audio' || msg.messageType === 'voice' ? (
                                                            <audio src={msg.mediaUrl} controls className="w-full rounded-lg p-2" />
                                                        ) : (
                                                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm p-4 text-blue-200 underline">
                                                                View Document
                                                            </a>
                                                        )}
                                                        {msg.content && <p className="text-sm mt-2 px-3 pb-2 break-words">{msg.content}</p>}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm px-4 py-2.5 break-words">{msg.content}</p>
                                                )}
                                                <span className={`text-[10px] px-3 pb-1.5 text-right opacity-60 ${isAdmin ? 'text-blue-100' : 'text-zinc-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0">
                                {selectedTicket.status === 'resolved' ? (
                                    <div className="text-center text-zinc-500 text-sm py-2">
                                        This ticket has been resolved. Chat is closed.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                                            <label className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded text-sm cursor-pointer transition-colors relative group">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'photo')} disabled={uploadingMedia} />
                                                <ImageIcon size={18} />
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Send Image</div>
                                            </label>
                                            <label className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded text-sm cursor-pointer transition-colors relative group">
                                                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'video')} disabled={uploadingMedia} />
                                                <Video size={18} />
                                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-800 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">Send Video</div>
                                            </label>
                                        </div>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={uploadingMedia ? "Uploading media..." : "Type a message..."}
                                            disabled={uploadingMedia}
                                            className="flex-1 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500"
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim() || isSending || uploadingMedia}
                                            className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                                        >
                                            <Send size={18} className={(isSending || uploadingMedia) ? 'animate-pulse' : ''} />
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
