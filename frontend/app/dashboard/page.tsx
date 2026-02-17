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
                // Ideally, backend should have a /api/stats endpoint.
                const res = await axios.get("http://localhost:4000/api/users");
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
        <div>
            <h1 className="text-3xl font-bold mb-6 text-zinc-800 dark:text-zinc-100">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Total Users */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Total Users</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.total}</h3>
                    </div>
                </div>

                {/* Active Users */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Active Users</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.active}</h3>
                    </div>
                </div>

                {/* Blocked Users */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg">
                        <UserX size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-zinc-500 font-medium">Blocked Users</p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.blocked}</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold mb-2">Welcome Back!</h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Use the sidebar to manage your bot settings, view users, or send broadcasts.
                    Your bot is currently running and monitoring user status.
                </p>
            </div>
        </div>
    );
}
