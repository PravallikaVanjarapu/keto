import axios from "axios";
import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Logo from "../assets/Battery/keto.png";
import "./login.scss";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Make POST request to login endpoint
      const response = await axios.post('https://www.ketomotors.in/login', { email, password, role });
      // console.log(response.data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('supplier', response.data.supplier);
      toast.info('Login Successful', {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      // Handle response data here, such as saving the token
      navigate("/keto/master");
      // For example: localStorage.setItem('token', response.data.token);
    } catch (error) {
      console.error(error);
      // Handle error here, such as showing an error message to the user
      toast.error(error.response ? error.response.data.error : error.messaage, {
        position: "bottom-right",
        autoClose: 5000, // closes after 5 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }


  };

  return (<>
    <ToastContainer />
    <div className="login-container">
      <div className="heading">
      </div>
      <div className="container">
        <div className="logo-card">
          <div className="logo">
            <img src={Logo} alt="keto" />
          </div>
        </div>
        <div className="login-card">
          <form onSubmit={handleLogin}>
            <input type="email" placeholder='Email' onChange={e => setEmail(e.target.value)} value={email} required />
            <input type="password" placeholder='Password' onChange={e => setPassword(e.target.value)} value={password} required />
            <input type="role" placeholder='Supplier' onChange={e => setRole(e.target.value.toUpperCase())} value={role} required />
            {/* <select onChange={e => setRole(e.target.value)} value={role} required>
              <option value="">Select Supplier</option>
              <option value="EXM">EXM</option>
              <option value="TTK">TTK</option>
              <option value="NEU">NEU</option>
              <option value="EXIDE">EXIDE</option>
              <option value="OTHERS">OTHERS</option>
              <option value="ADMIN">ADMIN</option>
            </select> */}
            <div className="row">
              <p>KetoMotors ™️</p>
              <button type="submit">Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </>
  )
}

export default Login;