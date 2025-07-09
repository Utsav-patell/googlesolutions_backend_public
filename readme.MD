# GoogleSolutions Backend (Public)

A robust and modular Node.js backend designed for scalable and secure API services, with a focus on e-waste management use cases. This repository features best practices for authentication, role-based access, Redis caching, and MongoDB integration.

## 🚀 Project Overview

This project provides a flexible backend structure for building RESTful APIs with:

- User authentication and role-based authorization
- Secure and scalable MongoDB data storage
- Redis caching for performance optimization
- Modular codebase (controllers, services, models, routes)
- Middleware for validation and error handling
- Example protected routes and admin-only access

Originally built to support an e-waste management platform, but easily adaptable for other solutions.

## 🛠️ Technologies Used

- Node.js, Express.js
- MongoDB (via Mongoose)
- Redis
- dotenv, cors, morgan (logging)
- Modular MVC architecture

## 📦 Setup & Usage

1. **Clone the repository**
   ```bash
   git clone https://github.com/Utsav-patell/googlesolutions_backend_public.git
   cd googlesolutions_backend_public
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `env_format.txt` to `.env` and fill in your credentials (MongoDB URI, Redis, PORT, etc.)

4. **Run the server**
   ```bash
   node app.js
   ```
   The server runs on the port specified in your `.env` file.

5. **API Endpoints**
   - Main API routes are under `/api`
   - Example public route: `GET /` — returns a welcome message
   - Example protected/admin route (requires token and role): `/admin`

## 💡 Features

- Centralized route management (`src/routes/api/api-routes.js`)
- Configurable database and cache layer
- Express middleware for JSON and CORS
- Error-handling middleware for consistent API responses

## 🤝 Contributing

Contributions welcome! Fork the repository, make changes, and submit a pull request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

-----------------------------------------------------------------------------------------------------------------------------------------------------------

Note : If you want to use this backend locally then just copy the env text File and add the required details in it.

Then just run npx nodemon app.js

API Documentation : https://documenter.getpostman.com/view/42125944/2sAYXBGf9H
