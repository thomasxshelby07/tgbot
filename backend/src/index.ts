import fastify from 'fastify';
import cors from '@fastify/cors';

import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { bot, initBot } from './bot';
import { settingsRoutes } from './routes/settings';
import cluster from 'cluster';
import os from 'os';

dotenv.config();

const app = fastify({
    bodyLimit: 100 * 1024 * 1024 // 100MB limit to allow large video/audio
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

app.register(fastifyMultipart, {
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});
app.register(fastifyStatic, {
    root: path.join(__dirname, '../../public/uploads'),
    prefix: '/uploads/',
});

import { broadcastRoutes } from './routes/broadcast';
import { initWorker } from './worker/broadcastWorker';
import { menuRoutes } from './routes/menu';
import { channelRoutes } from './routes/channels';
import { welcomeMessageRoutes } from './routes/welcomeMessages';
import vipRoutes from './routes/vip';
import { supportRoutes } from './routes/support';
import { chatRoutes } from './routes/chat';

import { authRoutes } from './routes/auth';
import { authMiddleware } from './middleware/auth';
import { Admin } from './models/Admin';
import bcrypt from 'bcrypt';

const seedSuperAdmin = async () => {
    try {
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !password) {
            console.log('⚠️ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set. Skipping seed.');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await Admin.findOneAndUpdate(
            { email },
            {
                $setOnInsert: {
                    email,
                    passwordHash,
                    role: 'superadmin',
                    permissions: ['all']
                }
            },
            { upsert: true, new: true }
        );
        console.log('✅ Super Admin seed checked/upserted.');

        // Cleanup any accidental duplicates (keep one)
        const duplicates = await Admin.find({ email });
        if (duplicates.length > 1) {
            console.log(`🧹 Cleaning up ${duplicates.length - 1} duplicate super admins...`);
            for (let i = 1; i < duplicates.length; i++) {
                await Admin.findByIdAndDelete(duplicates[i]._id);
            }
            console.log('✅ Duplicates cleaned.');
        }
    } catch (e) {
        console.error('Failed to seed Super Admin:', e);
    }
};

// Register public/auth routes
app.register(authRoutes);

// Register Protected Routes
app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', authMiddleware);
    
    protectedApp.register(settingsRoutes);
    protectedApp.register(uploadRoutes);
    protectedApp.register(userRoutes, { prefix: '/api' });
    protectedApp.register(broadcastRoutes);
    protectedApp.register(channelRoutes);
    protectedApp.register(welcomeMessageRoutes);
    protectedApp.register(vipRoutes, { prefix: '/api/vip' });
    protectedApp.register(supportRoutes, { prefix: '/api/support' });
    protectedApp.register(chatRoutes);
    
    console.log('Registering menu routes...');
    protectedApp.register(menuRoutes);
    console.log('Menu routes registered.');
});

// Register webhook route for Telegram - As per user request for Cloudflare Tunnel
// Webhook route removed for Polling Mode

import { webhookCallback } from 'grammy';

const start = async () => {
    try {
        await connectDB();
        if (cluster.worker?.id === 1) {
            await seedSuperAdmin();
        }
        await initBot();

        // Start Broadcast Worker ONLY ONCE — guard against multiple cluster workers
        // Must be called AFTER connectDB() and initBot() so bot is ready to send messages
        if (cluster.isWorker && cluster.worker?.id === 1) {
            initWorker();
        }

        // Health Check Route (for Railway)
        app.get('/', async (request, reply) => {
            return { status: 'alive', message: `Bot is alive on worker ${process.pid} 🚀` };
        });

        // Initialize Bot — MUST run on ALL workers so they can handle webhook updates
        await bot.init();
        console.log(`✅ Bot initialized on worker ${process.pid}`);

        // Only the primary process sets the webhook (avoid duplicate Telegram API calls)
        if (cluster.isPrimary) {
            const BASE_URL = process.env.BASE_URL;
            if (BASE_URL) {
                const webhookUrl = `${BASE_URL}/webhook`;
                console.log(`Configuring webhook to: ${webhookUrl}`);
                await bot.api.setWebhook(webhookUrl);
                console.log(`✅ Webhook set successfully`);
            } else {
                console.warn('⚠️ BASE_URL not set. Webhook NOT registered automatically. Please set via API or env var.');
            }
        }

        // Webhook Route handled by ALL workers for maximum throughput
        app.register(async (webhookScope) => {
            webhookScope.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
                try {
                    const json = JSON.parse(body as string);
                    done(null, json);
                } catch (err: any) {
                    err.statusCode = 400;
                    done(err, undefined);
                }
            });

            webhookScope.post('/webhook', async (req, reply) => {
                reply.send(); // Respond 200 OK immediately
                try {
                    // console.log(`🔹 WEBHOOK HIT ON WORKER ${process.pid}`);
                    if (req.body) {
                        await bot.handleUpdate(req.body as any);
                    } else {
                        console.warn('⚠️ Webhook received but body is empty');
                    }
                } catch (err) {
                    console.error(`❌ Error in webhook handling on worker ${process.pid}:`, err);
                }
            });
        });

        const port = Number(PORT) || 4000;
        await app.listen({ port: port, host: '0.0.0.0' });
        console.log(`✅ Server running at http://localhost:${port} on worker ${process.pid}`);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

// --- CLUSTER LOGIC FOR 10X PERFORMANCE ---
if (cluster.isPrimary) {
    const numCPUs = os.cpus().length;
    console.log(`🚀 Primary process ${process.pid} is running. Setting up ${numCPUs} workers.`);

    // Fork workers for each CPU core
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
        cluster.fork(); // Auto-restart dead workers
    });
} else {
    // Workers share the TCP connection
    start();
}
