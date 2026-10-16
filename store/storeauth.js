
export function saveLogin(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}

// Get current logged-in user
export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Get current user's role: admin or customer
export function getUserRole() {
  return getCurrentUser()?.role || null;
}

// Check if the user is an admin
export function isAdmin() {
  return getUserRole() === 'admin';
}

// Logout
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
