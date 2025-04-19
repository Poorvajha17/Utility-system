import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Login() {
    const { userType } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ 
        username: "", 
        password: "" 
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:8081/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);  
                localStorage.setItem("userId", data.userId); 
                localStorage.setItem("username", data.username); 
                localStorage.setItem("role", data.role); 

                // Redirect based on role
                navigate(data.role === "Customer" ? "/customer/dashboard" : "/employee/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="auth-container fade-in">
            <h1>{userType === "customer" ? "Customer Login" : "Employee Login"}</h1>
            <p className="text-center mb-3">
                Welcome back! Please enter your credentials
            </p>
            
            {error && (
                <div className="alert alert-danger mb-3">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-block mt-3">
                    Login
                </button>
            </form>

            <div className="text-center mt-3">
                <p>
                    Don't have an account?{' '}
                    <a href={`/${userType}/signup`} className="text-primary">
                        Sign up
                    </a>
                </p>
                <p>
                    <a href="/forgot-password" className="text-primary">
                        Forgot password?
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Login;