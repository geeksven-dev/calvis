import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import calendarRouter from './routes/calendar';
import symptomatikRouter from './routes/symptomatik';

const app = express();
const PORT = process.env.PORT ?? 3001;
const frontendDist = path.join(__dirname, '../../frontend/dist');

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/calendar', calendarRouter);
app.use('/api/symptomatik', symptomatikRouter);

// Serve built Vue frontend
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


