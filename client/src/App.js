import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from './pages/Dashboard';
import DataTable from './pages/DataTable';
import Error from './pages/Error';
import Home from './pages/Home';
// import LiveData from './pages/LiveData';
import Login from './pages/Login';
import Master from "./pages/Mastery";

function App() {
  return (

    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/keto" element={<ProtectedRoute><Home /></ProtectedRoute>}>
        <Route path="master" element={<ProtectedRoute><Master /></ProtectedRoute>} />
        <Route path="dashboard/:device" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="table/:make" element={<ProtectedRoute><DataTable /></ProtectedRoute>} /> {/* Corrected Path */}
        {/* <Route path="live" element={<ProtectedRoute><LiveData /></ProtectedRoute>} /> */}
      </Route>
      <Route path="*" element={<Error />} />
    </Routes>

  );
}

export default App;
