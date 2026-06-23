import jwt from 'jsonwebtoken';
import { appConfig } from '../config/app_config.js';
import { adminModel } from '../common/index.module.js';
import { sendResponse } from '../utils/helpers.js';

export const protectAdmin = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return sendResponse({
                res,
                statusCode: 401,
                error: 'No token provided',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, appConfig.ADMIN_JWT_SECRET);
        req.admin = await adminModel.findById(decoded.id);

        if (!req.admin) {
            return sendResponse({
                res,
                statusCode: 401,
                error: 'Admin not found',
            });
        }

        if (!req.admin.isActive) {
            return sendResponse({
                res,
                statusCode: 401,
                error: 'Admin account is deactivated',
            });
        }

        next();
    } catch (error) {
        sendResponse({
            res,
            statusCode: 401,
            error: 'Invalid token',
        });
    }
};

