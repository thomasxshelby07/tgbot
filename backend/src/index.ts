import fastify from 'fastify';
import cors from '@fastify/cors';

import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { bot, initBot } from './bot';
import { settingsRoutes } from './routes/settings';

dotenv.config();

const app = fastify({
    bodyLimit: 10 * 1024 * 1024 // 10MB
});
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

import { webhookCallback } from 'grammy';

const start = async () => {
    try {
        await connectDB();
        await initBot();

        // Start Broadcast Worker
        initWorker();

        // Health Check Route (for Railway)
        app.get('/', async (request, reply) => {
            return { status: 'alive', message: 'Bot is alive 🚀' };
        });

        // Webhook Route - Optimization for Railway/Telegram timeouts
        // 1. Respond immediately with 200 OK
        // 2. Process update asynchronously
        app.post('/webhook', async (req, reply) => {
            reply.send(); // Respond 200 OK immediately
            try {
                // Determine if we need to await this or strictly fire-and-forget.
                // Telegram wants 200 OK fast. Processing can happen in background.
                // Validating req.body is an object before passing
                if (req.body) {
                    await bot.handleUpdate(req.body as any);
                }
            } catch (err) {
                console.error('❌ Error in webhook handling:', err);
            }
        });

        const port = Number(PORT) || 4000;
        await app.listen({ port: port, host: '0.0.0.0' });
        console.log(`✅ Server running at http://localhost:${port}`);

        // Set Webhook
        const BASE_URL = process.env.BASE_URL;
        if (BASE_URL) {
            const webhookUrl = `${BASE_URL}/webhook`;
            console.log(`Configuring webhook to: ${webhookUrl}`);
            await bot.api.setWebhook(webhookUrl);
            console.log(`✅ Webhook set successfully`);
        } else {
            console.warn('⚠️ BASE_URL not set. Webhook NOT registered automatically. Please set via API or env var.');
        }

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
