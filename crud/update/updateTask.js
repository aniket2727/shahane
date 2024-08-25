


document.getElementById('update-task-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const status = document.getElementById('status').value;
    const priority = document.getElementById('priority').value;
    const dueDate = document.getElementById('due-date').value;
    
    const task = {
        title,
        description,
        status,
        priority,
        dueDate
    };
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        const result = await response.json();
        document.getElementById('response-message').textContent = result.message || 'Task updated successfully!';
        
    } catch (error) {
        console.error('Error updating task:', error);
        document.getElementById('response-message').textContent = 'Failed to update task.';
    }
});
