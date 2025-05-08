# Utility Management System

A full-stack utility management platform with React frontend and Node.js/Express backend.

## Features

- **Customer Portal**: Bill payments, consumption tracking, issue reporting
- **Employee Portal**: Customer management, billing, analytics
- **Secure Authentication**: JWT-based login system

## Tech Stack

- **Frontend**: React, Chart.js
- **Backend**: Node.js, Express
- **Database**: MySQL

## Quick Start

1. Clone repo
   git clone https://github.com/your-username/geru-utility-system.git

2. Setup backend
   cd backend && npm install

3. Setup frontend
   cd ../frontend && npm install

4. Start servers
   # Backend (from /backend)
   node server.js
   
   # Frontend (from /frontend) 
   npm start

Access at `http://localhost:3000`

## Configuration

Add `.env` to `/backend` with:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=your_secret_key

---
