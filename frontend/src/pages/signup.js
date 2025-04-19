import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function Signup() {
    const { userType } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        phone: "",
        address: "",
        classification: "Domestic",
        position: "",
        department: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const userData = {
            name: formData.name,
            username: formData.username,
            password: formData.password,
            phone: formData.phone,
            role: userType === "customer" ? "Customer" : "Employee",
            ...(userType === "customer" && {
                address: formData.address,
                classification: formData.classification
            }),
            ...(userType === "employee" && {
                position: formData.position,
                department: formData.department
            })
        };

        try {
            const response = await fetch("http://localhost:8081/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            
            if (response.ok) {
                alert("Signup successful!");
                navigate(`/${userType}/login`);
            } else {
                setError(data.message || "Signup failed");
            }
        } catch (error) {
            console.error("Signup error:", error);
            setError("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="auth-container fade-in">
            <h1>{userType === "customer" ? "Customer Signup" : "Employee Signup"}</h1>
            <p className="text-center mb-3">
                Create your {userType} account
            </p>
            
            {error && (
                <div className="alert alert-danger mb-3">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        placeholder="Choose a username"
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
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Customer-specific fields */}
                {userType === "customer" && (
                    <>
                        <div className="form-group">
                            <label htmlFor="address">Address</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                placeholder="Enter your address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="classification">Classification</label>
                            <select
                                id="classification"
                                name="classification"
                                value={formData.classification}
                                onChange={handleChange}
                                required
                            >
                                <option value="Domestic">Domestic</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Agricultural">Agricultural</option>
                            </select>
                        </div>
                    </>
                )}

                {/* Employee-specific fields */}
                {userType === "employee" && (
                    <>
                        <div className="form-group">
                            <label htmlFor="position">Position</label>
                            <input
                                type="text"
                                id="position"
                                name="position"
                                placeholder="Enter your position"
                                value={formData.position}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="department">Department</label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                placeholder="Enter your department"
                                value={formData.department}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </>
                )}

                <button type="submit" className="btn btn-primary btn-block mt-3">
                    Register
                </button>
            </form>

            <div className="text-center mt-3">
                <p>
                    Already have an account?{' '}
                    <a href={`/${userType}/login`} className="text-primary">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}

export default Signup;