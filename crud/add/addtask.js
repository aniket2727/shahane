

document.getElementById('add-task-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
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
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        
        const result = await response.json();
        document.getElementById('response-message').textContent = result.message || 'Task added successfully!';
        
    } catch (error) {
        console.error('Error adding task:', error);
        document.getElementById('response-message').textContent = 'Failed to add task.';
    }
});
