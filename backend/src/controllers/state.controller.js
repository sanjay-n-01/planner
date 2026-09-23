import { AppState } from '../models/state.model.js';

const EMPTY_STATE = {
  today: [],
  backlog: [],
  roadmap: {},
  notes: [],
  subjects: [],
  scores: [],
  restore: [],
  settings: {}
};

export const getState = async (_req, res, next) => {
  try {
    let state = await AppState.findOne().lean();

    if (!state) {
      state = await AppState.create(EMPTY_STATE);
      state = state.toObject();
    }

    res.json(state);
  } catch (error) {
    next(error);
  }
};

export const saveState = async (req, res, next) => {
  try {
    const state = await AppState.findOneAndReplace(
      {},
      { ...EMPTY_STATE, ...req.body },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    res.json(state);
  } catch (error) {
    next(error);
  }
};
