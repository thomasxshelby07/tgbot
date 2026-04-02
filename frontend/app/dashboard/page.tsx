"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Users, UserCheck, UserX } from "lucide-react";

export default function DashboardPage() {
    const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // For MVP, we calculate stats on the frontend from the /users endpoint.
                // For MVP, we calculate stats on the frontend from the /users endpoint.
                // Ideally, backend should have a /api/stats endpoint.
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                const res = await axios.get(`${apiUrl}/api/users`);
                const users = res.data;
                const total = users.length;
                const blocked = users.filter((u: any) => u.isBlocked).length;
                const active = total - blocked;
                setStats({ total, active, blocked });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="bg-slate-50 min-h-full">
            <h1 className="text-3xl font-black mb-8 text-slate-900 tracking-tight">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-all duration-300 group">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Users</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.total}</h3>
                    </div>
                </div>

                {/* Active Users */}
                <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-all duration-300 group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                        <UserCheck size={28} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Active Users</p>
                        <h3 className="text-3xl font-black text-slate-900">{stats.active}</h3>
                    </div>
                </div>

                {/* Blocked Users */}
                <div className="bg-white p-7 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 hover:shadow-md transition-all duration-300 group">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-all duration-500">
                        <UserX size={28} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Blocked Users</p>
                        <h3 className="text-3xl font-black text-slate-900 text-rose-600">{stats.blocked}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-110 duration-1000"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-black mb-3 text-slate-900">Welcome Back Admin!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-[15px]">
                        Manage your bot settings, view users, or send broadcasts from the sidebar. 
                        Your system is currently active and monitoring <strong>{stats.total} users</strong> across all channels.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            System Operational
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
