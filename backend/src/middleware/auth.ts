import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_tgbot_2024';

interface JwtPayload {
    adminId: string;
    role: string;
    permissions: string[];
    tokenVersion: number;
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({ error: 'Unauthorized: Missing or invalid token' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        const admin = await Admin.findById(decoded.adminId);
        if (!admin) {
            return reply.status(401).send({ error: 'Unauthorized: Admin not found' });
        }

        if (admin.tokenVersion !== decoded.tokenVersion) {
            return reply.status(401).send({ error: 'Unauthorized: Session expired' });
        }

        // Attach admin info to request
        (request as any).admin = {
            adminId: admin._id.toString(),
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions
        };

    } catch (error: any) {
        console.error('❌ [AUTH_MIDDLEWARE_ERROR]:', error.message || error);
        if (error.name === 'TokenExpiredError') {
            return reply.status(401).send({ error: 'Token expired' });
        }
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
    }
};

export const superAdminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        await authMiddleware(request, reply);
        
        const admin = (request as any).admin;
        if (!admin || admin.role !== 'superadmin') {
            return reply.status(403).send({ error: 'Forbidden: Super Admin access required' });
        }
    } catch (error) {
        return reply.status(401).send({ error: 'Unauthorized' });
    }
};

export const requirePermission = (permissionString: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            await authMiddleware(request, reply);
            
            const admin = (request as any).admin;
            if (admin.role === 'superadmin') return; // Super admin bypassed
            
            if (!admin.permissions.includes(permissionString) && !admin.permissions.includes('all')) {
                return reply.status(403).send({ error: `Forbidden: Requires ${permissionString} permission` });
            }
        } catch (error) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
    };
};
