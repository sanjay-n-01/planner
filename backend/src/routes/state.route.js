import { Router } from 'express';
import { getState, saveState } from '../controllers/state.controller.js';

const router = Router();

router.get('/', getState);
router.put('/', saveState);

export default router;
