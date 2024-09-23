import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth.js'; // Import the auth check function

const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // Redirect them to the /login page, but save the current location they were trying to go to
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;