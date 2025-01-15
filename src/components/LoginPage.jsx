import React, { useState } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '../AuthContext';

    const LoginPage = () => {
      const [role, setRole] = useState('clinician');
      const navigate = useNavigate();
      const { login } = useAuth();

      const handleLogin = () => {
        login({ role });
        navigate(role === 'clinician' ? '/clinician' : '/secretary');
      };

      return (
        <div className="container login-container">
          <h1>Login</h1>
          <label>
            Role:
            <select className="role-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="clinician">Clinician</option>
              <option value="secretary">Secretary</option>
            </select>
          </label>
          <button className="login-button" onClick={handleLogin}>Login</button>
        </div>
      );
    };

    export default LoginPage;
