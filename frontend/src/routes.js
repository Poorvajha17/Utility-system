import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import CustomerDashboard from "./pages/CustomerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";

import "./App.css";

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/:userType/login" element={<Login />} />
                <Route path="/:userType/signup" element={<Signup />} />
                <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            </Routes>
        </Router>
    );
}

export default AppRoutes;
