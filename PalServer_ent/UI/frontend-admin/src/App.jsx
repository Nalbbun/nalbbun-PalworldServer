// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; 
import {LangProvider} from "./context/LangContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import Metrics from "./pages/Metrics";
import Players from "./pages/Players";
import Config from "./pages/Config";

export default function App() {
  return ( 
      <Routes>
        {/*   */}
        <Route path="/login" element={<Login />} />

        {/*    */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        /> 
        <Route
          path="/logs/:instance"
          element={
            <ProtectedRoute>
              <Logs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/metrics/:instance"
          element={
            <ProtectedRoute>
              <Metrics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/players/:instance"
          element={
            <ProtectedRoute>
              <Players />
            </ProtectedRoute>
          }
        />
  
        <Route
          path="/config/:instance"
          element={
            <ProtectedRoute>
              <Config />
            </ProtectedRoute>
          }
        />
      </Routes> 
  );
}