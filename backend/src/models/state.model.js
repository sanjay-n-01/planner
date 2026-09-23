import mongoose from 'mongoose';

const appStateSchema = new mongoose.Schema(
  {
    today: { type: [mongoose.Schema.Types.Mixed], default: [] },
    backlog: { type: [mongoose.Schema.Types.Mixed], default: [] },
    roadmap: { type: mongoose.Schema.Types.Mixed, default: {} },
    notes: { type: [mongoose.Schema.Types.Mixed], default: [] },
    subjects: { type: [mongoose.Schema.Types.Mixed], default: [] },
    scores: { type: [mongoose.Schema.Types.Mixed], default: [] },
    restore: { type: [mongoose.Schema.Types.Mixed], default: [] },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { versionKey: false }
);

export const AppState = mongoose.model('AppState', appStateSchema);
