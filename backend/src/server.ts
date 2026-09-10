
import app from './app.js';
import { initializeEmailTransporter, verifyEmailTransporter } from './services/emailService.js';
import cacheService from './services/redisCacheService.js';
import openRouterService from './services/openRouterService.js';
import { getGroqModel, isGroqConfigured } from './services/groqService.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  // Initialize email transporter
  const emailTransporter = initializeEmailTransporter();
  if (emailTransporter) {
    await verifyEmailTransporter();
  }

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
║   ⚡ Groq: ${isGroqConfigured() ? `✅ ${getGroqModel('fastChat')}` : '❌ Not configured'}               ║
║   🤖 OpenRouter: ${openRouterService.isOpenRouterConfigured() ? `✅ ${openRouterService.getModelName('chat')}` : '❌ Not configured'}               ║
║   🔴 Redis: ${redisConnected ? `✅ Connected (${redisStats.memory || 'N/A'})` : '❌ Disconnected'}                     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
