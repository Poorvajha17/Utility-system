import React from "react";
import { useNavigate } from "react-router-dom";

function Header({ username }) {
    const navigate = useNavigate();

    return (
        <header className="header">
            <span className="username">{username}</span>
            <div className="header-buttons">
                <button onClick={() => navigate("/customer/dashboard")}>Home</button>
                <button onClick={() => navigate("/")}>Logout</button>
            </div>
        </header>
    );
}

export default Header;
