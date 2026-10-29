# 📖 SmartLib: Enterprise Library Management System

A full-stack, cloud-native Library Management System built with **FastAPI**, **React**, and **PostgreSQL (Neon)**. This system features strict Role-Based Access Control (RBAC), automated alerts, an activity log, CSV bulk imports, and a webcam barcode scanner.

## 🛠 Tech Stack

**Backend:**
- Python (FastAPI)
- PostgreSQL (Neon Serverless)
- SQLAlchemy (Async)
- JWT Authentication (Passlib & Python-Jose)
- Pandas (for CSV processing)

**Frontend:**
- React (Vite)
- React Router DOM
- Axios
- Recharts (Analytics)
- HTML5-QRCode (Webcam Barcode Scanner)

---

## ⚙️ How to Run Locally


.............................

1. Backend Setup
```bash
# Navigate to the backend folder
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create a .env file in the backend/ folder and add:
# DATABASE_URL=postgresql+asyncpg://your-neon-url
# JWT_SECRET=your-super-secret-key

# Run the FastAPI server
uvicorn app.main:app --reload

...............................

2. Frontend Setup
bash
# Open a new terminal and navigate to the frontend folder
cd frontend

# Install dependencies
npm install

# Run the React development server
npm run dev

.................................................

🔐 Default Test Credentials
Use these accounts to explore the different roles in the system:

👑 Admin (Super User - Full Access)

Email: piyush@test.com

Password: test1234

📚 Librarian (Manage Books & Transactions)

Email: carol@lib.com

Password: carol123

🎓 Member (Browse Books & View History)

Email: alice@lib.com

Password: alice123