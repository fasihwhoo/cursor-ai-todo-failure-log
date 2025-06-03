const { Client } = require('@notionhq/client');

class NotionService {
    constructor() {
        this.client = new Client({
            auth: process.env.NOTION_API_KEY,
        });
        this.databaseId = process.env.NOTION_DATABASE_ID;
        console.log('Notion Service initialized with database ID:', this.databaseId);
    }

    async createTask({ title, description, priority, project, dueDate, dueTime, todoistId, completed = false }) {
        try {
            console.log('Creating Notion task:', { title, priority, project, dueDate, dueTime, todoistId });
            const properties = {
                'Task Name': {
                    title: [{ text: { content: title } }],
                },
                Description: {
                    rich_text: [{ text: { content: description || '' } }],
                },
                Priority: {
                    select: { name: `p${priority}` },
                },
                Project: project
                    ? {
                          select: { name: project },
                      }
                    : { select: null },
                'Due Date': dueDate
                    ? {
                          date: { start: dueDate },
                      }
                    : { date: null },
                Time: {
                    rich_text: [{ text: { content: dueTime || '' } }],
                },
                'Task ID': {
                    rich_text: [{ text: { content: todoistId.toString() } }],
                },
                Completed: {
                    checkbox: completed,
                },
            };

            console.log('Notion properties prepared:', JSON.stringify(properties, null, 2));

            const response = await this.client.pages.create({
                parent: { database_id: this.databaseId },
                properties,
            });
            console.log('Notion task created successfully');
            return response;
        } catch (error) {
            console.error('Error creating Notion task:', error.message);
            if (error.body) {
                console.error('API Error details:', JSON.stringify(error.body, null, 2));
            }
            throw error;
        }
    }

    async updateTask(pageId, updates) {
        try {
            console.log('Updating Notion task:', pageId);
            console.log('Update data:', JSON.stringify(updates, null, 2));

            // Ensure we're sending a valid properties object
            const properties = {};

            if (updates.properties['Task Name']) {
                properties['Task Name'] = {
                    title: [{ text: { content: updates.properties['Task Name'].title[0].text.content } }],
                };
            }

            if (updates.properties['Description']) {
                properties['Description'] = {
                    rich_text: [{ text: { content: updates.properties['Description'].rich_text[0].text.content } }],
                };
            }

            if (updates.properties['Priority']) {
                properties['Priority'] = {
                    select: { name: updates.properties['Priority'].select.name },
                };
            }

            if (updates.properties['Project']) {
                properties['Project'] = updates.properties['Project'].select
                    ? { select: { name: updates.properties['Project'].select.name } }
                    : { select: null };
            }

            if (updates.properties['Due Date']) {
                properties['Due Date'] = updates.properties['Due Date'].date
                    ? { date: { start: updates.properties['Due Date'].date.start } }
                    : { date: null };
            }

            if (updates.properties['Time']) {
                properties['Time'] = {
                    rich_text: [{ text: { content: updates.properties['Time'].rich_text[0].text.content } }],
                };
            }

            if (updates.properties['Task ID']) {
                properties['Task ID'] = {
                    rich_text: [{ text: { content: updates.properties['Task ID'].rich_text[0].text.content } }],
                };
            }

            if ('Completed' in updates.properties) {
                properties['Completed'] = {
                    checkbox: updates.properties['Completed'].checkbox,
                };
            }

            console.log('Processed properties:', JSON.stringify(properties, null, 2));

            const response = await this.client.pages.update({
                page_id: pageId,
                properties,
            });
            console.log('Notion task updated successfully');
            return response;
        } catch (error) {
            console.error('Error updating Notion task:', error.message);
            if (error.body) {
                console.error('API Error details:', JSON.stringify(error.body, null, 2));
            }
            throw error;
        }
    }

    async deleteTask(pageId) {
        try {
            console.log('Deleting Notion task:', pageId);
            await this.client.pages.update({
                page_id: pageId,
                archived: true,
            });
            console.log('Notion task deleted successfully');
            return true;
        } catch (error) {
            console.error('Error deleting Notion task:', error.message);
            if (error.body) {
                console.error('API Error details:', JSON.stringify(error.body, null, 2));
            }
            throw error;
        }
    }

    async getTaskByTodoistId(todoistId) {
        try {
            console.log('Searching for Notion task with Todoist ID:', todoistId);
            const response = await this.client.databases.query({
                database_id: this.databaseId,
                filter: {
                    property: 'Task ID',
                    rich_text: {
                        equals: todoistId.toString(),
                    },
                },
            });
            console.log('Found Notion task:', response.results[0] ? 'Yes' : 'No');
            return response.results[0] || null;
        } catch (error) {
            console.error('Error getting Notion task by Todoist ID:', error.message);
            if (error.body) {
                console.error('API Error details:', JSON.stringify(error.body, null, 2));
            }
            throw error;
        }
    }

    async getAllTasks() {
        try {
            console.log('Fetching all Notion tasks');
            const response = await this.client.databases.query({
                database_id: this.databaseId,
            });
            console.log(`Found ${response.results.length} tasks in Notion`);
            return response.results;
        } catch (error) {
            console.error('Error getting all Notion tasks:', error.message);
            if (error.body) {
                console.error('API Error details:', JSON.stringify(error.body, null, 2));
            }
            throw error;
        }
    }

    _getPriorityString(priority) {
        return `p${priority}`;
    }

    _getPriorityNumber(priorityString) {
        return parseInt(priorityString?.replace('p', '')) || 4; // Default to p4 if invalid
    }
}

module.exports = new NotionService();
