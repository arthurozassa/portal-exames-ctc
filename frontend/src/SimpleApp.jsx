import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SimpleLogin from './pages/SimpleLogin';

function SimpleApp() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/" element={<SimpleLogin />} />
      </Routes>
    </Router>
  );
}

export default SimpleApp;