const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await api.login(credentials);
    console.log('Logged in user:', response.user); // This will show your user ID
    // ... rest of the code
  } catch (error) {
    // ... error handling
  }
}; 