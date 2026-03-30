import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import { authMiddleware, superAdminMiddleware } from '../middleware/auth';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_tgbot_2024';

export const authRoutes = async (app: FastifyInstance) => {
    
    // Login
    app.post('/api/auth/login', async (request, reply) => {
        const { email, password } = request.body as any;
        if (!email || !password) return reply.status(400).send({ error: 'Email and password required' });

        const admin = await Admin.findOne({ email });
        if (!admin) return reply.status(401).send({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) return reply.status(401).send({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { 
                adminId: admin._id, 
                role: admin.role, 
                permissions: admin.permissions,
                tokenVersion: admin.tokenVersion
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return reply.send({
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            }
        });
    });

    // Get current user profile
    app.get('/api/auth/me', { preHandler: [authMiddleware] }, async (request, reply) => {
        const reqUser = (request as any).admin;
        const admin = await Admin.findById(reqUser.adminId).select('-passwordHash');
        if (!admin) return reply.status(404).send({ error: 'Admin not found' });
        return reply.send(admin);
    });

    // --- SUPER ADMIN ONLY ROUTES ---

    // Get all admins
    app.get('/api/auth/admins', { preHandler: [superAdminMiddleware] }, async (request, reply) => {
        const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });
        return reply.send(admins);
    });

    // Create new admin
    app.post('/api/auth/admins', { preHandler: [superAdminMiddleware] }, async (request, reply) => {
        const { email, password, role, permissions } = request.body as any;
        
        if (!email || !password) return reply.status(400).send({ error: 'Email and password required' });

        const existing = await Admin.findOne({ email });
        if (existing) return reply.status(400).send({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newAdmin = await Admin.create({
            email,
            passwordHash,
            role: role || 'admin',
            permissions: permissions || []
        });

        return reply.status(201).send({
            id: newAdmin._id,
            email: newAdmin.email,
            role: newAdmin.role,
            permissions: newAdmin.permissions
        });
    });

    // Reset admin password
    app.put('/api/auth/admins/:id/reset', { preHandler: [superAdminMiddleware] }, async (request, reply) => {
        const { id } = request.params as any;
        const { newPassword } = request.body as any;

        if (!newPassword) return reply.status(400).send({ error: 'New password required' });

        const admin = await Admin.findById(id);
        if (!admin) return reply.status(404).send({ error: 'Admin not found' });

        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(newPassword, salt);
        admin.tokenVersion += 1; // Force active sessions to logout
        await admin.save();

        return reply.send({ success: true, message: 'Password reset and sessions invalidated' });
    });

    // Logout / Invalidate all sessions of an admin
    app.put('/api/auth/admins/:id/logout', { preHandler: [superAdminMiddleware] }, async (request, reply) => {
        const { id } = request.params as any;
        
        const admin = await Admin.findById(id);
        if (!admin) return reply.status(404).send({ error: 'Admin not found' });

        admin.tokenVersion += 1;
        await admin.save();

        return reply.send({ success: true, message: 'Admin logged out from all devices' });
    });

    // Delete admin
    app.delete('/api/auth/admins/:id', { preHandler: [superAdminMiddleware] }, async (request, reply) => {
        const { id } = request.params as any;
        const admin = await Admin.findById(id);
        if (!admin) return reply.status(404).send({ error: 'Admin not found' });

        if (admin.role === 'superadmin' && admin.email === 'supertg07@bot.com') {
            return reply.status(400).send({ error: 'Cannot delete primary super admin' });
        }

        await admin.deleteOne();
        return reply.send({ success: true });
    });
};
