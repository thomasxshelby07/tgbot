'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, KeyRound, Loader2, ShieldOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface Admin {
    _id: string;
    email: string;
    role: string;
    permissions: string[];
    createdAt: string;
}

export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Create form state
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('admin');
    const [newPermission, setNewPermission] = useState('deposit_withdraw'); // 'deposit_withdraw' or 'id_other'

    const fetchAdmins = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.get(`${apiUrl}/api/auth/admins`);
            setAdmins(res.data);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to load admins');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/auth/admins`, {
                email: newEmail,
                password: newPassword,
                role: newRole,
                permissions: newRole === 'superadmin' ? ['all'] : [newPermission]
            });
            toast.success('Admin created successfully');
            setIsCreating(false);
            setNewEmail('');
            setNewPassword('');
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create admin');
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!process.browser || !window.confirm(`Are you sure you want to delete ${email}?`)) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.delete(`${apiUrl}/api/auth/admins/${id}`);
            toast.success('Admin deleted');
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to delete');
        }
    };

    const handleResetPassword = async (id: string, email: string) => {
        const newPass = window.prompt(`Enter new password for ${email}:`);
        if (!newPass) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.put(`${apiUrl}/api/auth/admins/${id}/reset`, { newPassword: newPass });
            toast.success('Password reset successfully. Active sessions invalidated.');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to reset password');
        }
    };

    const handleForceLogout = async (id: string, email: string) => {
        if (!window.confirm(`Are you sure you want to forcefully logout ${email} from all devices?`)) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.put(`${apiUrl}/api/auth/admins/${id}/logout`);
            toast.success('Admin forcefully logged out');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to logout admin');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
    }

    return (
        <div className="space-y-10 p-6 sm:p-2 max-w-6xl mx-auto pb-32">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Access Control</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Administrative Node Management</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="group bg-slate-900 hover:bg-blue-600 text-white px-8 py-4 rounded-[24px] text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl shadow-slate-900/10 active:scale-95 translate-y-2 lg:translate-y-0"
                >
                    <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> 
                    <span>Add New Admin</span>
                </button>
            </div>

            {isCreating && (
                <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-2xl shadow-slate-900/[0.03] animate-in zoom-in-95 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    
                    <h2 className="text-xl font-black text-slate-900 mb-8 italic uppercase tracking-tight">Provision New Credentials</h2>
                    <form onSubmit={handleCreate} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">Email Endpoint</label>
                                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner" placeholder="admin@system.local" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">Security Phrase</label>
                                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-mono shadow-inner" placeholder="••••••••" />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">Clearence Level</label>
                                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase tracking-widest text-[13px] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none">
                                    <option value="admin">Support Technician</option>
                                    <option value="superadmin">Root Administrator (Full Access)</option>
                                </select>
                            </div>
                            {newRole === 'admin' && (
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 italic">Vessel Assignment</label>
                                    <select value={newPermission} onChange={(e) => setNewPermission(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase tracking-widest text-[13px] focus:outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm cursor-pointer appearance-none">
                                        <option value="deposit_withdraw">Financial Operations</option>
                                        <option value="id_other">Identification Verification</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 pt-6 border-t border-slate-50">
                            <button type="submit" className="bg-slate-900 text-white hover:bg-blue-600 px-10 py-5 rounded-[24px] text-[13px] font-black uppercase tracking-[0.25em] transition-all shadow-xl shadow-slate-900/10 active:scale-95">Verify & Create Node</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-600 transition-colors">Discard</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/[0.02]">
                <table className="w-full text-left text-sm border-separate border-spacing-0">
                    <thead className="bg-slate-50/50 text-slate-400 border-b border-slate-100">
                        <tr>
                            <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Identifier Endpoint</th>
                            <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Access Level</th>
                            <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px]">Scope Protocol</th>
                            <th className="px-10 py-6 font-black uppercase tracking-[0.2em] text-[10px] text-right">Intervention</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {admins.map((admin) => (
                            <tr key={admin._id} className="hover:bg-slate-50/50 transition-all group">
                                <td className="px-10 py-6">
                                     <div className="flex flex-col">
                                        <span className="font-black text-slate-900 text-[15px]">{admin.email}</span>
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter mt-1 italic">Registered on {new Date(admin.createdAt).toLocaleDateString()}</span>
                                     </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${admin.role === 'superadmin' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                        {admin.role === 'superadmin' ? 'Root' : 'Admin'}
                                    </span>
                                </td>
                                <td className="px-10 py-6">
                                    <div className="flex gap-2">
                                        {admin.permissions.map(p => {
                                            let label = p;
                                            if (p === 'all') label = 'Full Scope';
                                            if (p === 'deposit_withdraw') label = 'Finance';
                                            if (p === 'id_other') label = 'Verification';
                                            return (
                                                <span key={p} className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-tighter">
                                                    {label}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => handleResetPassword(admin._id, admin.email)} title="Refresh Security" className="p-3 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border border-transparent hover:border-blue-100 active:scale-90">
                                            <KeyRound size={18} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={() => handleForceLogout(admin._id, admin.email)} title="Invalidate Sessions" className="p-3 text-slate-300 hover:text-orange-600 hover:bg-orange-50 rounded-2xl transition-all border border-transparent hover:border-orange-100 active:scale-90">
                                            <ShieldOff size={18} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={() => handleDelete(admin._id, admin.email)} title="Decommission Node" className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 active:scale-90">
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-10 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <Loader2 size={40} className="animate-spin text-slate-400" />
                                        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Searching for valid nodes...</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
