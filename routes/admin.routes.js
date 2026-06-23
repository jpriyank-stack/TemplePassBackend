import express from 'express';
import {
    registerAdmin,
    loginAdmin,
    checkToken,
    addManager,
} from '../controller/admin.controller.js';

import { protectAdmin } from '../middlewares/adminAuth.js';

const router = express.Router();

router.post('/register', registerAdmin);
router.post('/login', loginAdmin);
router.get('/check-token', protectAdmin, checkToken);
router.post('/add-manager', protectAdmin, addManager);

export default router;