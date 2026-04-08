import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Giveaway } from '../models/Giveaway';
import { GiveawaySubmission } from '../models/GiveawaySubmission';
import { Settings } from '../models/Settings';
import { cache } from '../utils/cache';

const SETTINGS_KEY = 'bot_settings';

export const giveawayRoutes = async (fastify: FastifyInstance) => {
    // Get all giveaways (for listing)
    fastify.get('/all', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const giveaways = await Giveaway.find().sort({ createdAt: -1 });
            return reply.send(giveaways);
        } catch (error: any) {
            console.error('❌ [GIVEAWAY_ALL_ERROR]:', error.message);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get specific giveaway configuration
    fastify.get('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const giveaway = await Giveaway.findById(req.params.id);
            if (!giveaway) return reply.status(404).send({ error: 'Giveaway not found' });
            return reply.send(giveaway);
        } catch (error: any) {
            console.error('❌ [GIVEAWAY_FIND_ERROR]:', error.message);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get the most recent giveaway (default)
    fastify.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const giveaway = await Giveaway.findOne().sort({ createdAt: -1 });
            return reply.send(giveaway || {});
        } catch (error: any) {
            console.error('❌ [GIVEAWAY_GET_ERROR]:', error.message || error);
            if (error.stack) console.error(error.stack);
            return reply.status(500).send({ error: 'Internal Server Error', details: error.message });
        }
    });

    // Create or Update giveaway configuration
    fastify.post('/', async (req: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        try {
            const { _id, title, description, questions, active, showButton, inactiveMessage, mediaUrl, mediaType, buttonText } = req.body as any;
            
            let giveaway;
            if (_id) {
                giveaway = await Giveaway.findByIdAndUpdate(_id, {
                    title, description, questions, active, showButton, inactiveMessage, mediaUrl, mediaType, buttonText
                }, { new: true });
            } else {
                giveaway = await Giveaway.create({
                    title, description, questions, active, showButton, inactiveMessage, mediaUrl, mediaType, buttonText
                });
            }

            // Sync with global settings (one active giveaway rule)
            if (active && giveaway) {
                // Deactivate all others EXCEPT this one
                // await Giveaway.updateMany({ _id: { $ne: giveaway._id } }, { active: false });
            }

            await Settings.findOneAndUpdate({}, { 
                giveawayActive: active,
                giveawayButtonText: buttonText || "🎁 Giveaway Offer"
            }, { upsert: true, new: true });
            await cache.del(SETTINGS_KEY);

            return reply.send(giveaway);
        } catch (error: any) {
            console.error('❌ [GIVEAWAY_POST_ERROR]:', error.message || error);
            if (error.stack) console.error(error.stack);
            return reply.status(500).send({ error: 'Internal Server Error', details: error.message });
        }
    });

    // Export submissions for a giveaway as CSV
    fastify.get('/export/:giveawayId', async (req: FastifyRequest<{ Params: { giveawayId: string } }>, reply: FastifyReply) => {
        try {
            const submissions = await GiveawaySubmission.find({ giveawayId: req.params.giveawayId }).sort({ createdAt: -1 });
            
            if (submissions.length === 0) {
                return reply.status(404).send({ error: 'No submissions found to export' });
            }

            // Generate CSV
            let csv = 'Date,Name,Phone,Telegram,DafabetID,Answers\n';
            submissions.forEach(sub => {
                const answers = sub.answers.map(a => a.answer).join(' | ');
                const date = new Date(sub.createdAt).toLocaleString().replace(/,/g, '');
                csv += `${date},${sub.realName},${sub.phoneNumber},${sub.username || sub.telegramId},${sub.dafabetId},"${answers}"\n`;
            });

            reply.header('Content-Type', 'text/csv');
            reply.header('Content-Disposition', `attachment; filename=giveaway_export_${req.params.giveawayId}.csv`);
            return reply.send(csv);
        } catch (error) {
            console.error('Error exporting submissions:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete a giveaway and all its submissions
    fastify.delete('/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const admin = (req as any).admin;
            if (admin && admin.role !== 'superadmin') {
                return reply.status(403).send({ error: 'Only Super Admin can delete giveaways' });
            }

            await Giveaway.findByIdAndDelete(req.params.id);
            await GiveawaySubmission.deleteMany({ giveawayId: req.params.id });
            
            return reply.send({ success: true, message: 'Giveaway and submissions deleted' });
        } catch (error) {
            console.error('Error deleting giveaway:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get submissions for a giveaway
    fastify.get('/submissions', async (req: FastifyRequest<{ Querystring: { giveawayId?: string } }>, reply: FastifyReply) => {
        try {
            const { giveawayId } = req.query;
            const query = giveawayId ? { giveawayId } : {};
            const submissions = await GiveawaySubmission.find(query).sort({ createdAt: -1 });
            return reply.send(submissions);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get submissions for a giveaway (by ID in params)
    fastify.get('/submissions/:giveawayId', async (req: FastifyRequest<{ Params: { giveawayId: string } }>, reply: FastifyReply) => {
        try {
            const submissions = await GiveawaySubmission.find({ giveawayId: req.params.giveawayId }).sort({ createdAt: -1 });
            return reply.send(submissions);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // Delete all submissions for a giveaway
    fastify.delete('/submissions/:giveawayId', async (req: FastifyRequest<{ Params: { giveawayId: string } }>, reply: FastifyReply) => {
        try {
            const admin = (req as any).admin;
            if (admin && admin.role !== 'superadmin') {
                return reply.status(403).send({ error: 'Only Super Admin can delete submissions' });
            }

            await GiveawaySubmission.deleteMany({ giveawayId: req.params.giveawayId });
            return reply.send({ success: true, message: 'Submissions deleted' });
        } catch (error) {
            console.error('Error deleting submissions:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
