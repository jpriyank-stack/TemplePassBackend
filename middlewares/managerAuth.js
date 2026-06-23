import jwt from 'jsonwebtoken';
import { appConfig } from '../config/app_config.js';
import { managerModel } from '../common/index.module.js';

export const protectManager = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, appConfig.JWT_SECRET);
        req.manager = await managerModel.findById(decoded.id);

        if (!req.manager) {
            return res.status(401).json({
                success: false,
                message: 'Manager not found',
            });
        }

        if (!req.manager.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Manager account is deactivated',
            });
        }

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};