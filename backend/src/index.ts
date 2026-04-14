import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import calendarRouter from './routes/calendar';
import symptomatikRouter from './routes/symptomatik';
import eventsRouter from './routes/events';
import authRouter from './routes/auth';
import videosRouter from './routes/videos';

const app = express();
const PORT = process.env.PORT ?? 3001;
const frontendDist = path.join(__dirname, '../../frontend/dist');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/calendar', calendarRouter);
app.use('/api/symptomatik', symptomatikRouter);
app.use('/api/events', eventsRouter);
app.use('/api/auth', authRouter);
app.use('/api/videos', videosRouter);

// Serve built Vue frontend
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});





