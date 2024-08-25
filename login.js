document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        try {
            // Send a POST request to the backend API for login
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                // Store the JWT token in localStorage or a cookie
                localStorage.setItem('token', result.token);
                document.getElementById('message').textContent = result.message;
                document.getElementById('message').style.color = 'green';

                // Redirect to a protected page (e.g., tasks.html)
                window.location.href = 'tasks.html';
            } else {
                document.getElementById('message').textContent = result.message;
                document.getElementById('message').style.color = 'red';
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('message').textContent = 'An error occurred. Please try again.';
            document.getElementById('message').style.color = 'red';
        }
    } else {
        // Show an error message if fields are missing
        document.getElementById('message').textContent = 'Please fill in both fields.';
        document.getElementById('message').style.color = 'red';
    }
});
