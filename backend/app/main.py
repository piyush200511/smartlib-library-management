from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, books, transactions, csv_import, users, notifications
from app.database import Base, engine
# Import models so they are registered with Base
from app.models import user, book, transaction, notification  # noqa

app = FastAPI(
    title="Library Management System API",
    description="Advanced LMS with RBAC + JWT + CSV Import + AI Recommendations",
    version="1.0.0"
)

# Allowed origins for Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    # Add your deployed frontend URL here later e.g., "https://your-app.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(books.router)
app.include_router(transactions.router)
app.include_router(csv_import.router)
app.include_router(notifications.router)

@app.get("/")
async def root():
    return {"msg": "LMS API is live", "docs": "/docs"}