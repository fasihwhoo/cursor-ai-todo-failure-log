const todoistService = require('../services/todoist');
const notionService = require('../services/notion');

async function syncTodoistToNotion(todoistTask) {
    try {
        console.log('Starting Todoist → Notion sync for task:', todoistTask.content);

        // Check if task already exists in Notion
        const existingNotionTask = await notionService.getTaskByTodoistId(todoistTask.id);
        console.log('Existing Notion task found:', existingNotionTask ? 'Yes' : 'No');

        // Parse date and time if available
        let dueDate = null;
        let dueTime = null;
        if (todoistTask.due) {
            console.log('Processing due date:', todoistTask.due);
            const dueDateTime = new Date(todoistTask.due.datetime || todoistTask.due.date);
            dueDate = dueDateTime.toISOString().split('T')[0];
            if (todoistTask.due.datetime) {
                dueTime = dueDateTime.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });
            }
            console.log('Parsed date and time:', { dueDate, dueTime });
        }

        if (existingNotionTask) {
            console.log('Updating existing Notion task');
            await notionService.updateTask(existingNotionTask.id, {
                properties: {
                    'Task Name': {
                        title: [{ text: { content: todoistTask.content } }],
                    },
                    Description: {
                        rich_text: [{ text: { content: todoistTask.description || '' } }],
                    },
                    Priority: {
                        select: { name: `p${todoistTask.priority}` },
                    },
                    'Due Date': dueDate
                        ? {
                              date: { start: dueDate },
                          }
                        : { date: null },
                    Time: {
                        rich_text: [{ text: { content: dueTime || '' } }],
                    },
                    Project: todoistTask.project_id
                        ? {
                              select: { name: todoistTask.project_name || 'Inbox' },
                          }
                        : { select: null },
                    Completed: {
                        checkbox: todoistTask.completed,
                    },
                },
            });
            console.log('Successfully updated Notion task');
        } else {
            console.log('Creating new Notion task');
            await notionService.createTask({
                title: todoistTask.content,
                description: todoistTask.description,
                priority: todoistTask.priority,
                project: todoistTask.project_name || 'Inbox',
                dueDate,
                dueTime,
                todoistId: todoistTask.id,
                completed: todoistTask.completed,
            });
            console.log('Successfully created Notion task');
        }
    } catch (error) {
        console.error('Error syncing Todoist to Notion:', error);
        throw error;
    }
}

async function syncNotionToTodoist() {
    try {
        console.log('Starting Notion → Todoist sync');
        const notionTasks = await notionService.getAllTasks();
        console.log(`Found ${notionTasks.length} tasks in Notion`);

        for (const task of notionTasks) {
            try {
                const todoistId = task.properties['Task ID']?.rich_text[0]?.text.content;
                console.log(`Processing Notion task: ${task.properties['Task Name'].title[0]?.text.content}`);
                console.log('Todoist ID:', todoistId || 'None');

                // Skip if task is already synced with Todoist
                if (todoistId) {
                    console.log('Task already synced with Todoist, skipping');
                    continue;
                }

                const title = task.properties['Task Name'].title[0]?.text.content;
                const description = task.properties['Description']?.rich_text[0]?.text.content || '';

                // Check for duplicates in Todoist
                console.log('Checking for duplicates in Todoist');
                const todoistTasks = await todoistService.getAllTasks();
                const duplicate = todoistTasks.find((t) => t.content === title && t.description === description);

                if (duplicate) {
                    console.log('Duplicate found in Todoist, deleting Notion task');
                    await notionService.deleteTask(task.id);
                    continue;
                }

                // Combine date and time for Todoist
                let dueDateTime = null;
                const dueDate = task.properties['Due Date']?.date?.start;
                const dueTime = task.properties['Time']?.rich_text[0]?.text.content;

                if (dueDate) {
                    if (dueTime) {
                        dueDateTime = `${dueDate}T${dueTime}:00`;
                    } else {
                        dueDateTime = dueDate;
                    }
                    console.log('Due date/time:', dueDateTime);
                }

                console.log('Creating task in Todoist');
                // Create new task in Todoist
                const newTodoistTask = await todoistService.createTask({
                    content: title,
                    description: description,
                    priority: notionService._getPriorityNumber(task.properties['Priority']?.select?.name),
                    dueDateTime,
                    project_name: task.properties['Project']?.select?.name || 'Inbox',
                });
                console.log('Task created in Todoist:', newTodoistTask.id);

                // Update Notion task with Todoist ID
                console.log('Updating Notion task with Todoist ID');
                await notionService.updateTask(task.id, {
                    properties: {
                        'Task ID': {
                            rich_text: [{ text: { content: newTodoistTask.id.toString() } }],
                        },
                    },
                });
                console.log('Successfully synced task to Todoist');
            } catch (error) {
                console.error('Error processing individual task:', error);
                // Continue with next task even if this one fails
                continue;
            }
        }
    } catch (error) {
        console.error('Error in Notion to Todoist sync:', error);
        throw error;
    }
}

module.exports = {
    syncTodoistToNotion,
    syncNotionToTodoist,
};
