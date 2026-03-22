import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { VipMember } from '../models/VipMember';
import { Settings } from '../models/Settings';
import ExcelJS from 'exceljs';
import { cache } from '../utils/cache';

const SETTINGS_KEY = 'bot_settings';

export default async function vipRoutes(fastify: FastifyInstance) {
    // Get VIP Members
    fastify.get('/members', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const members = await VipMember.find().sort({ createdAt: -1 });
            return members;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch VIP members' });
        }
    });

    // Export VIP Members to Excel
    fastify.get('/export', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const members = await VipMember.find().sort({ createdAt: -1 });

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('VIP Members');

            worksheet.columns = [
                { header: 'Telegram ID', key: 'telegramId', width: 20 },
                { header: 'Name', key: 'name', width: 20 },
                { header: 'Phone Number', key: 'phoneNumber', width: 20 },
                { header: 'Interest', key: 'interest', width: 15 },
                { header: 'Joined At', key: 'createdAt', width: 25 },
            ];

            members.forEach(member => {
                worksheet.addRow({
                    telegramId: member.telegramId,
                    name: member.name,
                    phoneNumber: member.phoneNumber,
                    interest: member.interest,
                    createdAt: member.createdAt.toLocaleString(),
                });
            });

            // Set headers for file download
            reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            reply.header('Content-Disposition', 'attachment; filename=vip_members.xlsx');

            const buffer = await workbook.xlsx.writeBuffer();
            return reply.send(buffer);
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to export VIP members' });
        }
    });

    // Get VIP Settings
    fastify.get('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const settings = await Settings.findOne();
            if (!settings) return { vipButtonText: '🌟 JOIN VIP', vipWelcomeMessage: '', vipChannelLink: '', vipActive: true };
            return {
                vipButtonText: settings.vipButtonText,
                vipWelcomeMessage: settings.vipWelcomeMessage,
                vipChannelLink: settings.vipChannelLink,
                vipActive: settings.vipActive,
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch VIP settings' });
        }
    });

    // Update VIP Settings
    fastify.patch('/settings', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { vipButtonText, vipWelcomeMessage, vipChannelLink, vipActive } = request.body as any;
            
            const settings = await Settings.findOneAndUpdate(
                {},
                { vipButtonText, vipWelcomeMessage, vipChannelLink, vipActive },
                { upsert: true, new: true }
            );

            // Invalidate cache
            await cache.del(SETTINGS_KEY);

            return settings;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ error: 'Failed to update VIP settings' });
        }
    });
}
