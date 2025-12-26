
import app from './app.js';
import { initializeEmailTransporter } from './services/emailService.js';
import cacheService from './services/redisCacheService.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  // Initialize email transporter
  initializeEmailTransporter();

  // Check AI and Redis connections
  const redisConnected = await cacheService.checkConnection();
  const redisStats = await cacheService.getCacheStats();

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🛒 Shopping Expense Tracker API                            ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║   🤖 AI Service: ${process.env.GROQ_API_KEY ? '✅ Groq Connected' : '❌ Not configured'}               ║
║   🔴 Redis: ${redisConnected ? `✅ Connected (${redisStats.memory || 'N/A'})` : '❌ Disconnected'}                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
