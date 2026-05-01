# Subscription Overload Manager

## 1. Project Overview
**Subscription Overload Manager** is a full-stack web application designed to help users track, manage, and analyze their recurring subscriptions (e.g., streaming services, software licenses, fitness memberships). 

### Key Features
- **Centralized Dashboard:** View all active subscriptions in one place.
- **Analytics & Insights:** Visual breakdown of monthly and yearly expenses.
- **Renewal Alerts:** Automated alerts for upcoming subscription renewals.
- **Secure Authentication:** User-specific accounts to privately manage data.
- **Subscription Management:** Easy CRUD operations to add, update, or remove subscriptions.

### Problem it Solves
With the rise of subscription-based services, users often suffer from "subscription fatigue"—forgetting to cancel unused services, losing track of renewal dates, and accumulating hidden costs. This app provides a transparent view of all recurring expenses, allowing users to make informed financial decisions.

---

## 2. Architecture & Methodology
### High-Level Architecture
The project follows a standard **Client-Server Architecture**:
- **Frontend (Client):** A Single Page Application (SPA) built with React.
- **Backend (Server):** A RESTful API built with Node.js and Express.
- **Database:** A NoSQL MongoDB database.

### Design Patterns
- **MVC (Model-View-Controller):** The backend is structured using MVC principles. Routes direct traffic to Controllers, which interact with Mongoose Models.
- **Component-Based UI:** The frontend is modularized into reusable React components.
- **Provider Pattern:** React Context is used for global state management (e.g., Authentication state).

### Development Methodology
The project aligns with Agile/Iterative development, utilizing rapid prototyping tools like Vite and TailwindCSS to quickly iterate on UI and functionality.

---

## 3. Tech Stack

### Languages
- JavaScript (ES6+), JSX

### Frontend
- **Framework:** React 19, Vite
- **Styling:** TailwindCSS 4
- **Routing:** React Router v7
- **Forms & Validation:** Formik, Yup
- **Data Visualization:** Chart.js (`react-chartjs-2`), Recharts
- **HTTP Client:** Axios
- **Icons & UI Notifications:** Lucide React, React Toastify

### Backend
- **Framework:** Node.js, Express.js
- **Database ORM:** Mongoose (MongoDB)
- **Authentication:** JSON Web Tokens (JWT), bcryptjs for password hashing
- **Middleware:** CORS, Express Validator

---

## 4. Project Structure

The project is structured into two main workspaces: `/frontend` and `/backend`.

```
.
├── backend/
│   ├── config/         # Database connection setup (db.js)
│   ├── controllers/    # Business logic (authController, subscriptionController)
│   ├── middleware/     # Custom middleware (JWT auth verification, error handling)
│   ├── models/         # Mongoose schemas (User.js, Subscription.js)
│   ├── routes/         # Express API routes
│   ├── .env            # Environment variables (ignored in version control)
│   └── server.js       # Express server entry point
│
└── frontend/
    ├── src/
    │   ├── assets/     # Static files and images
    │   ├── components/ # Reusable UI pieces (Navbar, SubscriptionCard, Modals)
    │   ├── context/    # React Context (AuthContext)
    │   ├── pages/      # Full views (DashboardPage, Analytics, LoginPage)
    │   ├── services/   # API abstraction layer (Axios interceptors)
    │   ├── App.jsx     # Root component and router config
    │   └── main.jsx    # React DOM rendering entry point
    ├── index.html      # HTML template
    └── package.json    # Frontend dependencies and scripts
```

---

## 5. Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local installation or MongoDB Atlas cluster)

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd FSD
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_key
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

---

## 6. Usage

To run the project locally, you need to start both the backend and frontend servers.

**Start the Backend Server:**
```bash
cd backend
npm run dev
```
*The API will run on `http://localhost:5000`*

**Start the Frontend Development Server:**
```bash
cd frontend
npm run dev
```
*The UI will be accessible at `http://localhost:5173`*

### Example API Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user and receive a JWT
- `GET /api/subscriptions` - Fetch all subscriptions for the logged-in user
- `POST /api/subscriptions` - Add a new subscription

---

## 7. Data Flow & Pipelines

1. **Client Interaction:** The user interacts with the React UI (e.g., submitting the "Add Subscription" form).
2. **Form Validation:** Formik and Yup validate the inputs on the client side.
3. **API Request:** Axios sends an HTTP request with the JWT in the Authorization header to the Express backend.
4. **Middleware:** The backend verifies the JWT and attaches the `user.id` to the request object.
5. **Controller & DB:** The controller uses Mongoose to perform the requested CRUD operation in MongoDB.
6. **Response:** The backend responds with JSON data, and the React UI state updates to reflect the changes.

---

## 8. Testing

*Currently, the application relies on manual testing.*

- **Backend Testing:** Can be performed using tools like Postman or Insomnia to hit the REST endpoints.
- **Frontend Testing:** Visual regression and functional testing are done manually via the Vite development server. 

*(Future roadmap includes adding automated unit tests via Jest and React Testing Library).*

---

## 9. Deployment

### Build Process
To generate a production-ready build for the frontend:
```bash
cd frontend
npm run build
```
This creates a `/dist` folder with minified static assets.

### Deployment Strategy
- **Frontend:** Can be hosted on static hosting services like **Vercel**, **Netlify**, or **Render**.
- **Backend:** Can be deployed to **Render**, **Heroku**, or **DigitalOcean App Platform**.
- **Database:** Highly recommended to use **MongoDB Atlas** for a managed, cloud-based database.

---

## 10. Contribution Guidelines

We welcome contributions! To contribute:

1. **Fork the repository** and clone it locally.
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Commit your changes:** Follow standard commit conventions (e.g., `feat: added email alerts`).
4. **Push to the branch:** `git push origin feature/your-feature-name`
5. **Open a Pull Request** describing your changes.

**Coding Standards:** The frontend utilizes ESLint. Please ensure your code passes `npm run lint` before submitting a PR.

---

## 11. Known Issues / Limitations
- No support for multi-currency conversions; all costs are assumed to be in a single base currency.
- Email/SMS notifications for upcoming renewals are not currently implemented (alerts only show in the UI).
- Hard deletion of accounts currently leaves orphaned subscription records (needs a pre-remove hook in Mongoose).

---

## 12. Future Improvements / Roadmap
- **OAuth Integration:** Add Google and GitHub login functionality.
- **Automated Email Reminders:** Implement `node-cron` and `Nodemailer` to send emails 3 days before a subscription renews.
- **Advanced Filtering & Export:** Allow users to export their subscription data to CSV or PDF.
- **Automated Testing Suite:** Introduce Jest for backend coverage and Cypress for end-to-end frontend testing.

