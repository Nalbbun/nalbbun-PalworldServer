// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; 

// Layouts (새로 생성해야 함)
import AdminLayout from "./layouts/AdminLayout";
import OperatorLayout from "./layouts/OperatorLayout";

// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminConfig from "./pages/admin/Config"; 
import AdminPlayers from "./pages/admin/Players";
import UserManagement from "./pages/admin/UserManagement";

// Operator Pages
import OpDashboard from "./pages/operator/Dashboard";
import OpConfig from "./pages/operator/Config";
import OpPlayers from "./pages/operator/Players";

// Common Pages
import Login from "./pages/common/Login"; 
import Logs from "./pages/common/Logs";
import Metrics from "./pages/common/Metrics";


export default function App() {
  return ( 
      <Routes>
        {/* === 공통 로그인 === */}
        <Route path="/login" element={<Login />} />

        {/* === 관리자 (Admin) === */}
        <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
               <AdminLayout />  
            </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="config/:instance" element={ <AdminConfig /> } />           
          <Route path="players/:instance" element={ <AdminPlayers />} />              
          <Route path="logs/:instance" element={<Logs />} /> 
          <Route path="metrics/:instance" element={ <Metrics />} /> 
        </Route> 

        {/* === 운영자 (Operator) === */}
        <Route path="/operator" element={
            <ProtectedRoute allowedRoles={['operator']}>
                <OperatorLayout />  
            </ProtectedRoute>
        }>
          <Route index element={<OpDashboard />} />
          <Route path="config/:instance" element={ <OpConfig /> } />   
          <Route path="players/:instance" element={ <OpPlayers />} />              
          <Route path="logs/:instance" element={<Logs />} /> 
          <Route path="metrics/:instance" element={ <Metrics />} /> 
        </Route>
        
        {/* === 기본 경로 (리다이렉트) === */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes> 
  );
}