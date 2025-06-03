const axios = require('axios');

class TodoistService {
    constructor() {
        this.apiToken = process.env.TODOIST_API_TOKEN;
        this.apiUrl = 'https://api.todoist.com/rest/v2';
        this.client = axios.create({
            baseURL: this.apiUrl,
            headers: {
                Authorization: `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async createTask({ content, description, priority, dueDateTime, project_name }) {
        try {
            let project_id = null;
            if (project_name && project_name !== 'Inbox') {
                const projects = await this.getProjects();
                const project = projects.find((p) => p.name === project_name);
                if (project) {
                    project_id = project.id;
                }
            }

            const response = await this.client.post('/tasks', {
                content,
                description,
                priority,
                due_datetime: dueDateTime,
                project_id,
            });
            return response.data;
        } catch (error) {
            console.error('Error creating Todoist task:', error);
            throw error;
        }
    }

    async updateTask(taskId, updates) {
        try {
            if (updates.project_name) {
                const projects = await this.getProjects();
                const project = projects.find((p) => p.name === updates.project_name);
                if (project) {
                    updates.project_id = project.id;
                }
                delete updates.project_name;
            }

            await this.client.post(`/tasks/${taskId}`, updates);
            return true;
        } catch (error) {
            console.error('Error updating Todoist task:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            await this.client.delete(`/tasks/${taskId}`);
            return true;
        } catch (error) {
            console.error('Error deleting Todoist task:', error);
            throw error;
        }
    }

    async getTask(taskId) {
        try {
            const response = await this.client.get(`/tasks/${taskId}`);
            return response.data;
        } catch (error) {
            console.error('Error getting Todoist task:', error);
            throw error;
        }
    }

    async getAllTasks() {
        try {
            const response = await this.client.get('/tasks');
            return response.data;
        } catch (error) {
            console.error('Error getting all Todoist tasks:', error);
            throw error;
        }
    }

    async getProjects() {
        try {
            const response = await this.client.get('/projects');
            return response.data;
        } catch (error) {
            console.error('Error getting Todoist projects:', error);
            throw error;
        }
    }

    validateWebhook(request) {
        const eventData = request.body?.event_data;
        return !!eventData && !!eventData.id;
    }
}

module.exports = new TodoistService();
