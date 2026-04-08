import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Quiz } from '../models/Quiz';
import { QuizVote } from '../models/QuizVote';
import { User } from '../models/User';
import { broadcastQueue } from '../queue/broadcastQueue';

export const quizRoutes = async (fastify: FastifyInstance) => {
    // 1. Get all quizzes (with vote counts)
    fastify.get('/api/quiz', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const quizzes = await Quiz.find().sort({ createdAt: -1 });
            
            // Get aggregate vote counts
            const results = await Promise.all(quizzes.map(async (quiz) => {
                const votes = await QuizVote.aggregate([
                    { $match: { quizId: quiz._id } },
                    { $group: { _id: "$optionIndex", count: { $sum: 1 } } }
                ]);
                
                const optionVotes = quiz.options.map((opt, index) => {
                    const match = votes.find(v => v._id === index);
                    return { option: opt, votes: match ? match.count : 0 };
                });

                return {
                    ...quiz.toJSON(),
                    results: optionVotes
                };
            }));

            return reply.send(results);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 2. Create a new Quiz
    fastify.post('/api/quiz', async (req: FastifyRequest<{ Body: { question: string; options: string[] } }>, reply: FastifyReply) => {
        try {
            const { question, options } = req.body;
            if (!question || !options || options.length < 2) {
                return reply.status(400).send({ error: 'Question and at least 2 options are required.' });
            }

            const quiz = await Quiz.create({ question, options });
            return reply.send(quiz);
        } catch (error) {
            console.error('Error creating quiz:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 3. Broadcast Quiz
    fastify.post('/api/quiz/:id/broadcast', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const quiz = await Quiz.findById(req.params.id);
            if (!quiz) return reply.status(404).send({ error: 'Quiz not found' });

            // Prepare inline buttons for broadcast queue
            const buttons = quiz.options.map((opt, index) => ({
                text: opt,
                callback_data: `quiz_${quiz._id}_${index}`
            }));

            let cursor = User.find({ isBlocked: false }).select('telegramId').cursor();
            let count = 0;

            for await (const user of cursor) {
                if (user.telegramId) {
                    await broadcastQueue.add('broadcast-message', {
                        userId: user.telegramId,
                        message: `📊 *QUIZ / POLL*\n\n${quiz.question}`,
                        buttons: buttons
                    }, {
                        removeOnComplete: true,
                        removeOnFail: 1000
                    });
                    count++;
                }
            }

            quiz.totalBroadcasted += count;
            quiz.status = 'active';
            await quiz.save();

            return reply.send({ success: true, queued: count });
        } catch (error) {
            console.error('Error broadcasting quiz:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // 4. Delete Quiz
    fastify.delete('/api/quiz/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            await Quiz.findByIdAndDelete(req.params.id);
            await QuizVote.deleteMany({ quizId: req.params.id });
            return reply.send({ success: true });
        } catch (error) {
            console.error('Error deleting quiz:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
