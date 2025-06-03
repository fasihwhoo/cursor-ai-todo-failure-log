const express = require('express');
const router = express.Router();
const todoistService = require('../services/todoist');
const { syncTodoistToNotion } = require('../utils/sync');

router.post('/webhook', async (req, res) => {
    try {
        // Validate webhook signature
        if (!todoistService.validateWebhook(req)) {
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }

        const { event_name, event_data } = req.body;

        // Handle different webhook events
        switch (event_name) {
            case 'item:added':
            case 'item:updated':
                await syncTodoistToNotion(event_data);
                break;

            case 'item:deleted':
                // Handle deletion if needed
                break;

            default:
                console.log(`Unhandled webhook event: ${event_name}`);
        }

        res.status(200).json({ status: 'success' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
