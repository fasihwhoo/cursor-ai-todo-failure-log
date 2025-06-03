# Todoist-Notion Task Sync

A Node.js application that provides two-way synchronization between Todoist tasks and a Notion database.

## Features

-   🔄 Two-way sync between Todoist and Notion
-   🎯 Real-time updates from Todoist via webhooks
-   ⏰ Periodic sync from Notion (every 5 minutes)
-   🔍 Duplicate detection and handling
-   🔐 Secure webhook validation

## Prerequisites

-   Node.js >= 18.0.0
-   A Todoist account with API access
-   A Notion account with API access and an integration
-   A Notion database set up with the following properties:
    -   Title (title)
    -   Description (text)
    -   Priority (select: Low, Medium, High, Urgent)
    -   Platform (select)
    -   Due Date (date)
    -   todoist_id (text)
    -   Completed (checkbox)

## Setup

1. Clone the repository:

    ```bash
    git clone <your-repo-url>
    cd todoist-notion-sync
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Create a `.env` file based on `.env.example`:

    ```bash
    cp .env.example .env
    ```

4. Fill in your environment variables:

    - `TODOIST_API_TOKEN`: Your Todoist API token
    - `TODOIST_CLIENT_SECRET`: Your Todoist app client secret (for webhook validation)
    - `NOTION_API_KEY`: Your Notion integration token
    - `NOTION_DATABASE_ID`: Your Notion database ID
    - `PORT`: Port for the Express server (default: 3000)

5. Set up Todoist webhooks:
    - Create a new webhook in your Todoist app settings
    - Set the webhook URL to `https://your-domain.com/api/todoist/webhook`
    - Events to subscribe to:
        - `item:added`
        - `item:updated`
        - `item:deleted`

## Running the Application

Development mode with auto-reload:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## How It Works

### Todoist → Notion Sync

-   When a task is created or updated in Todoist, a webhook is triggered
-   The application validates the webhook signature
-   The task is created/updated in the Notion database
-   The Todoist task ID is stored in Notion for reference

### Notion → Todoist Sync

-   Every 5 minutes, the application checks for new tasks in Notion
-   For each new task (without a todoist_id):
    -   Checks for duplicates in Todoist
    -   If no duplicate exists, creates the task in Todoist
    -   Updates the Notion task with the new Todoist ID
    -   If a duplicate exists, deletes the Notion task

## Deployment

This application is designed to be deployed on Render. To deploy:

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
    - Build Command: `npm install`
    - Start Command: `npm start`
4. Add your environment variables in the Render dashboard
5. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC
