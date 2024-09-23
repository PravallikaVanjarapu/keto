// userController.js

import User from "../models/Users.js"; // Import the User model or any other required dependencies

// Controller function to handle a specific route (e.g., GET /users)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find(); // Fetch users from the database using the User model
    res.status(200).json(users); // Respond with the fetched users in JSON format
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Other controller functions for handling different routes related to the "User" resource

// Export all the controller functions you want to use in your routes
export default {
  getUsers,
  // Other controller functions
};
