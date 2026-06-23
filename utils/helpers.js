import jwt from 'jsonwebtoken';
import dayjs from "dayjs";
import { appConfig } from '../config/app_config.js';

// Send Response Helper
export const sendResponse = ({ res, statusCode, message = null, error = null, data = null, token = null }) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
  };

  // Add message if provided
  if (message) {
    response.message = message;
  }

  // Add error if provided
  if (error) {
    response.error = error;
  }

  // Add token if provided
  if (token) {
    response.token = token;
  }

  // Add data if provided
  if (data) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Create Admin JWT Token
export const createAdminJWT = (adminId, email) => {
  return jwt.sign(
    { id: adminId, email, type: 'admin' },
    appConfig.ADMIN_JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Create Manager JWT Token
export const createManagerJWT = (managerId, email) => {
  return jwt.sign(
    { id: managerId, email, type: 'manager' },
    appConfig.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

export const formatDate = (date) => {

  if(!date) return "";

  return dayjs(date).format("DD MMMM YYYY");

};

