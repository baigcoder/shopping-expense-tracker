
import app from './app.js';
import { initializeEmailTransporter } from './services/emailService.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    // Initialize email transporter
    initializeEmailTransporter();

    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🛒 Shopping Expense Tracker API                            ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});
