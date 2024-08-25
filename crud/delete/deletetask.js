

document.getElementById('delete-task-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        document.getElementById('response-message').textContent = result.message || 'Task deleted successfully!';
        
    } catch (error) {
        console.error('Error deleting task:', error);
        document.getElementById('response-message').textContent = 'Failed to delete task.';
    }
});
