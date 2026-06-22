import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import CVEditor from './pages/CVEditor';
import JobOfferAnalyzer from './pages/JobOfferAnalyzer';
import DirectEdit from './pages/DirectEdit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/direct-edit" element={<DirectEdit />} />
        <Route path="/editor/:id" element={<CVEditor />} />
        <Route path="/oferta" element={<JobOfferAnalyzer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
