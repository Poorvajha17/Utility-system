import React from "react";
import { useNavigate } from "react-router-dom";

function Sidebar({ setActivePage }) {
    return (
        <aside className="sidebar">
            <button onClick={() => setActivePage("summary")}>Dashboard</button>
            <button onClick={() => setActivePage("consumption")}>Energy Consumption</button>
            <button onClick={() => setActivePage("payments")}>Payment History</button>
            <button onClick={() => setActivePage("contact")}>Update Contact Info</button>
            <button onClick={() => setActivePage("report")}>Report Power Failure</button>
            <button onClick={() => setActivePage("payment")}>Make Payment</button>
        </aside>
    );
}

export default Sidebar;
