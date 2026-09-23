import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = process.env.PORT || 5000;

try {
  await connectDatabase();
  app.listen(port, () => {
    console.log(`Planner API listening on port ${port}`);
  });
} catch (error) {
  console.error('Failed to start planner API', error);
  process.exit(1);
}
