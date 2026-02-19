import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Settings } from '../models/Settings';
import { cache } from '../utils/cache';

const SETTINGS_KEY = 'bot_settings';

export const settingsRoutes = async (fastify: FastifyInstance) => {
    fastify.get('/api/settings/welcome', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const settings = await Settings.findOne();
            return reply.send({
                message: settings?.welcomeMessage || "Welcome to the bot!",
                mediaUrl: settings?.welcomeMessageMediaUrl || "",
                buttons: settings?.welcomeMessageButtons || []
            });
        } catch (error) {
            console.error('Error fetching welcome message:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    fastify.post('/api/settings/welcome', async (request: FastifyRequest<{ Body: { message: string; mediaUrl?: string; buttons?: { text: string; url: string }[] } }>, reply: FastifyReply) => {
        try {
            const { message, mediaUrl, buttons } = request.body;
            console.log('POST /api/settings/welcome - Body:', JSON.stringify(request.body, null, 2));

            if (!message) {
                return reply.status(400).send({ error: 'Message is required' });
            }

            const settings = await Settings.findOne();
            if (settings) {
                settings.welcomeMessage = message;
                settings.welcomeMessageMediaUrl = mediaUrl || "";
                settings.welcomeMessageButtons = buttons || [];
                await settings.save();
                console.log('Settings updated:', settings);
            } else {
                const newSettings = await Settings.create({
                    welcomeMessage: message,
                    welcomeMessageMediaUrl: mediaUrl || "",
                    welcomeMessageButtons: buttons || []
                });
                console.log('Settings created:', newSettings);
            }

            return reply.send({ success: true, message: 'Welcome message updated' });
        } catch (error) {
            console.error('Error updating welcome message:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        } finally {
            // Invalidate cache so bot picks up changes immediately
            await cache.del(SETTINGS_KEY);
        }
    });
};
