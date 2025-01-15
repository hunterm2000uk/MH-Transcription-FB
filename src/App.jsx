import React, { useState } from 'react';
    import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
    import LoginPage from './components/LoginPage';
    import ClinicianView from './components/ClinicianView';
    import SecretaryView from './components/SecretaryView';
    import { AuthProvider } from './AuthContext';

    function App() {
      return (
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/clinician" element={<ClinicianView />} />
              <Route path="/secretary" element={<SecretaryView />} />
            </Routes>
          </Router>
        </AuthProvider>
      );
    }

    export default App;
