import fastify from 'fastify';
import cors from '@fastify/cors';

import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { bot, initBot } from './bot';
import { settingsRoutes } from './routes/settings';

dotenv.config();

const app = fastify();
const PORT = process.env.PORT || 4000;
const DOMAIN = process.env.DOMAIN || '';

app.register(cors, {
    origin: '*', // Allow all for MVP, restrict in production
});

import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { uploadRoutes } from './routes/upload';
import { userRoutes } from './routes/users';

app.register(fastifyMultipart);
app.register(fastifyStatic, {
    root: path.join(__dirname, '../../public/uploads'),
    prefix: '/uploads/',
});

import { broadcastRoutes } from './routes/broadcast';
import { initWorker } from './worker/broadcastWorker';
import { menuRoutes } from './routes/menu';

app.register(settingsRoutes);
app.register(uploadRoutes);
app.register(userRoutes);
app.register(broadcastRoutes);
console.log('Registering menu routes...');
app.register(menuRoutes);
console.log('Menu routes registered.');

// Register webhook route for Telegram - As per user request for Cloudflare Tunnel
// Webhook route removed for Polling Mode

const start = async () => {
    try {
        await connectDB();
        await initBot();

        // Start Broadcast Worker
        initWorker();

        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`✅ Server running at http://localhost:${PORT}`);

        // Switch to POLLING mode as requested
        console.log('🔄 Switching to POLLING mode...');
        await bot.api.deleteWebhook();
        bot.start({
            allowed_updates: ['message', 'callback_query', 'my_chat_member'],
            onStart: (botInfo) => {
                console.log(`✅ Bot started as @${botInfo.username} (Polling Mode)`);
            }
        });

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
