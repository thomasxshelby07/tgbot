import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
        Telegram Bot Admin Panel
      </h1>
      <p className="mb-8 text-zinc-400">Manage your bot users and broadcasts</p>
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
