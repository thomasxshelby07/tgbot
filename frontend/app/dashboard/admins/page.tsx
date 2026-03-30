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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Admin Management</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage dashboard access and permissions.</p>
                </div>
                <button 
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Add Admin
                </button>
            </div>

            {isCreating && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Create New Admin</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Role</label>
                                <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                                    <option value="admin">Support Admin</option>
                                    <option value="superadmin">Super Admin (All Access)</option>
                                </select>
                            </div>
                            {newRole === 'admin' && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Team Assignment</label>
                                    <select value={newPermission} onChange={(e) => setNewPermission(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500">
                                        <option value="deposit_withdraw">Deposit & Withdrawal Team</option>
                                        <option value="id_other">ID & Other Issues Team</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Cancel</button>
                            <button type="submit" className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-bold transition-all">Create Account</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950/50 text-zinc-400 border-b border-zinc-800">
                        <tr>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Role</th>
                            <th className="px-6 py-4 font-medium">Permissions</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                        {admins.map((admin) => (
                            <tr key={admin._id} className="hover:bg-zinc-800/20 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{admin.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${admin.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {admin.role.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-zinc-400 max-w-xs truncate">
                                    {admin.permissions.map(p => {
                                        if (p === 'all') return 'Full Access';
                                        if (p === 'deposit_withdraw') return 'Deposit & Withdraw';
                                        if (p === 'id_other') return 'ID & Other';
                                        return p;
                                    }).join(', ')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleResetPassword(admin._id, admin.email)} title="Reset Password" className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                                            <KeyRound size={16} />
                                        </button>
                                        <button onClick={() => handleForceLogout(admin._id, admin.email)} title="Force Logout" className="p-2 text-zinc-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-colors">
                                            <ShieldOff size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(admin._id, admin.email)} title="Delete Admin" className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {admins.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No admins found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
