import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SupportTicket } from '../models/SupportTicket';
import { Settings } from '../models/Settings';
import { cache } from '../utils/cache';

import { bot } from '../bot';
import { ChatMessage } from '../models/ChatMessage';
import { InputFile } from 'grammy';

const SETTINGS_KEY = 'bot_settings';

export const supportRoutes = async (fastify: FastifyInstance) => {
    // Get all support tickets
    fastify.get('/tickets', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const admin = (req as any).admin;
            let query: any = {};
            
            if (admin && admin.role !== 'superadmin') {
                if (admin.permissions.includes('deposit_withdraw')) {
                    query.issueType = { $in: ['Deposit', 'Withdrawal'] };
                } else if (admin.permissions.includes('id_other')) {
                    query.issueType = { $in: ['ID', 'Other'] };
                } else if (!admin.permissions.includes('all')) {
                    return reply.status(403).send({ error: 'No ticket permissions' });
                }
            }

            const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
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
            
            // Notify user gracefully that the support session ended
            try {
                // Return them to the main menu logically
                const { MainMenuButton } = require('../models/MainMenuButton');
                const menuButtons = await MainMenuButton.find({ active: true }).sort({ order: 1 });
                const settings = await Settings.findOne();
                const keyboard = { keyboard: [] as any[], resize_keyboard: true };
                const row2 = [];
                if (settings?.vipActive) row2.push({ text: settings.vipButtonText || "🌟 JOIN VIP" });
                if (settings?.supportActive) row2.push({ text: settings.supportButtonText || "🆘 Help & Support" });
                if (row2.length > 0) keyboard.keyboard.push(row2);
                
                let currentRow: any[] = [];
                menuButtons.forEach((btn: any, idx: number) => {
                    currentRow.push({ text: btn.text });
                    if (currentRow.length === 2 || idx === menuButtons.length - 1) {
                        keyboard.keyboard.push(currentRow);
                        currentRow = [];
                    }
                });

                await bot.api.sendMessage(ticket.telegramId, "✅ Your support ticket has been resolved by the admin. The chat session is now closed.", {
                    reply_markup: keyboard.keyboard.length > 0 ? keyboard : undefined
                });
            } catch (notifyErr) {
                console.error("Failed to notify user about ticket resolution:", notifyErr);
            }

            return reply.send(ticket);
        } catch (error) {
            console.error('Error resolving ticket:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Reopen a ticket
    fastify.patch('/tickets/:id/reopen', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status: 'open' }, { new: true });
            if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });
            
            try {
                const markup = { keyboard: [[{ text: "❌ End Chat" }]], resize_keyboard: true };
                await bot.api.sendMessage(ticket.telegramId, "🔄 *Admin has reopened your support ticket.*\n\nYou may send messages again. Click 'End Chat' when you are done.", { parse_mode: 'Markdown', reply_markup: markup });
            } catch (notifyErr) {
                console.error("Failed to notify user about ticket reopen:", notifyErr);
            }

            return reply.send(ticket);
        } catch (error) {
            console.error('Error reopening ticket:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete a ticket
    fastify.delete('/tickets/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const admin = (req as any).admin;
            if (admin && admin.role !== 'superadmin') {
                return reply.status(403).send({ error: 'Only Super Admin can delete tickets' });
            }
            const ticket = await SupportTicket.findByIdAndDelete(req.params.id);
            if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });
            // Delete associated messages
            await ChatMessage.deleteMany({ ticketId: ticket._id });
            return reply.send({ success: true, message: 'Ticket deleted' });
        } catch (error) {
            console.error('Error deleting ticket:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get messages for a ticket
    fastify.get('/tickets/:id/messages', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const messages = await ChatMessage.find({ ticketId: req.params.id }).sort({ createdAt: 1 });
            return reply.send(messages);
        } catch (error) {
            console.error('Error fetching ticket messages:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Send a message from admin to user for a specific ticket
    fastify.post('/tickets/:id/messages', async (req: FastifyRequest<{ Params: { id: string }, Body: { content?: string, mediaUrl?: string, messageType?: string } }>, reply: FastifyReply) => {
        try {
            const ticket = await SupportTicket.findById(req.params.id);
            if (!ticket) return reply.status(404).send({ error: 'Ticket not found' });

            const { content, mediaUrl, messageType } = req.body;
            
            // Send exactly via bot to user
            try {
                const markup = { keyboard: [[{ text: "❌ End Chat" }]], resize_keyboard: true };

                if (mediaUrl && messageType === 'photo') {
                    await bot.api.sendPhoto(ticket.telegramId, mediaUrl, { caption: content ? `👨‍💻 *Admin:*\n${content}` : '👨‍💻 *Admin sent a photo*', parse_mode: 'Markdown', reply_markup: markup });
                } else if (mediaUrl && messageType === 'video') {
                    await bot.api.sendVideo(ticket.telegramId, mediaUrl, { caption: content ? `👨‍💻 *Admin:*\n${content}` : '👨‍💻 *Admin sent a video*', parse_mode: 'Markdown', reply_markup: markup });
                } else if (mediaUrl && messageType === 'audio') {
                    await bot.api.sendAudio(ticket.telegramId, mediaUrl, { caption: content ? `👨‍💻 *Admin:*\n${content}` : '👨‍💻 *Admin sent an audio file*', parse_mode: 'Markdown', reply_markup: markup });
                } else if (content) {
                    await bot.api.sendMessage(ticket.telegramId, `👨‍💻 *Admin:*\n${content}`, { parse_mode: 'Markdown', reply_markup: markup });
                } else {
                    return reply.status(400).send({ error: 'Message content or media required' });
                }
            } catch (tgErr) {
                console.error("Failed to send telegram message in support ticket:", tgErr);
                // We still continue to create the DB record so the admin sees the message they sent.
            }

            const newMessage = await ChatMessage.create({
                ticketId: ticket._id,
                sender: 'admin',
                content: content || '',
                messageType: messageType || 'text',
                mediaUrl: mediaUrl || undefined,
                isRead: true
            });

            return reply.send(newMessage);
        } catch (error) {
            console.error('Error sending ticket reply:', error);
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
