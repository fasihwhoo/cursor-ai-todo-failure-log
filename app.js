require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const todoistRoutes = require('./routes/todoist');
const notionRoutes = require('./routes/notion');
const { syncNotionToTodoist } = require('./utils/sync');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Routes
app.use('/api/todoist', todoistRoutes);
app.use('/api/notion', notionRoutes);

// Log environment variables (without showing actual values)
console.log('Environment check:');
console.log('TODOIST_API_TOKEN:', process.env.TODOIST_API_TOKEN ? 'Set' : 'Not set');
console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY ? 'Set' : 'Not set');
console.log('NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? 'Set' : 'Not set');

// Cron job to sync Notion tasks to Todoist every minute during testing
// Change back to */5 * * * * for production
cron.schedule('* * * * *', async () => {
    try {
        console.log('Running Notion → Todoist sync...', new Date().toISOString());
        await syncNotionToTodoist();
        console.log('Sync completed successfully');
    } catch (error) {
        console.error('Sync error:', error);
        if (error.response) {
            console.error('API Error details:', {
                status: error.response.status,
                data: error.response.data,
            });
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('Waiting for sync events...');
});
