import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import EmployeeManagement from './components/EmployeeManagement/EmployeeManagement';
import './components/EmployeeManagement/styles.css';

function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmployeeManagement />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;