import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto w-full text-zinc-900 dark:text-zinc-100">
                {children}
            </main>
        </div>
    );
}
