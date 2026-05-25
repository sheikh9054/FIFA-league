import 'dotenv/config';
import { createAppAndServer } from './app';

const PORT = parseInt(process.env.PORT || '4000', 10);

const httpServer = createAppAndServer();

httpServer.listen(PORT, () => {
  console.log(`🏆 FIFA League API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for realtime updates`);
});
