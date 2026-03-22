import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SupportTicket } from '../models/SupportTicket';
import { Settings } from '../models/Settings';
import { cache } from '../utils/cache';

const SETTINGS_KEY = 'bot_settings';

export const supportRoutes = async (fastify: FastifyInstance) => {
    // Get all support tickets
    fastify.get('/tickets', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const tickets = await SupportTicket.find().sort({ createdAt: -1 });
            return reply.send(tickets);
        } catch (error) {
            console.error('Error fetching support tickets:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Resolve a ticket
    fastify.patch('/tickets/:id/resolve', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
            if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });
            return reply.send(ticket);
        } catch (error) {
            console.error('Error resolving ticket:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete a ticket
    fastify.delete('/tickets/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
            if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });
            return reply.send({ success: true, message: 'Ticket deleted' });
        } catch (error) {
            console.error('Error deleting ticket:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get support settings
    fastify.get('/settings', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const settings = await Settings.findOne();
            return reply.send({
                supportButtonText: settings?.supportButtonText || "🆘 Help & Support",
                supportActive: settings?.supportActive ?? true
            });
        } catch (error) {
            console.error('Error fetching support settings:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update support settings
    fastify.patch('/settings', async (req: FastifyRequest<{ Body: { supportButtonText?: string; supportActive?: boolean } }>, reply: FastifyReply) => {
        try {
            const { supportButtonText, supportActive } = req.body;
            const settings = await Settings.findOneAndUpdate(
                {},
                { supportButtonText, supportActive },
                { upsert: true, new: true }
            );
            await cache.del(SETTINGS_KEY);
            return reply.send(settings);
        } catch (error) {
            console.error('Error updating support settings:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
