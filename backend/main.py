import os
import json
import secrets
from fastapi import Header
from bson import json_util
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
from fastapi import HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timezone

class ApplicationRequest(BaseModel):
    jobId: str
    name: str
    email: str
    coverLetter: str

load_dotenv("backend/.env")

MONGO_URI = os.getenv("MONGO_URI")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DATABASE_NAME]
app = FastAPI()

app = FastAPI(title="JobBoard Pro")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
ADMIN_SECRET = os.getenv("ADMIN_SECRET")

@app.get("/")
def home():
    return {"message": "Welcome to JobBoard Pro"}


@app.get("/health")
def health():
    return {"status": "Backend is running"}


@app.get("/db-health")
def database_health():
    try:
        client.admin.command("ping")
        return {
            "status": "MongoDB connected successfully",
            "database": DATABASE_NAME
        }
    except Exception as error:
        return {"status": "Connection failed", "error": str(error)}

@app.get("/api/jobs")
def get_jobs(skip: int = 0, limit: int = 10):
    total = db["jobs"].count_documents({})

    jobs = list(
        db["jobs"].find().skip(skip).limit(limit)
    )

    return json.loads(json_util.dumps({
        "total_jobs": total,
        "returned_jobs": len(jobs),
        "jobs": jobs
    }))

@app.get("/api/companies")
def get_companies(skip: int = 0, limit: int = 10):
    total = db["companies"].count_documents({})

    companies = list(
        db["companies"].find().skip(skip).limit(limit)
    )

    return json.loads(json_util.dumps({
        "total_companies": total,
        "returned_companies": len(companies),
        "companies": companies
    }))

@app.get("/api/skills")
def get_skills(skip: int = 0, limit: int = 10):
    total = db["skills"].count_documents({})

    skills = list(
        db["skills"].find().skip(skip).limit(limit)
    )

    return json.loads(json_util.dumps({
        "total_skills": total,
        "returned_skills": len(skills),
        "skills": skills
    }))

@app.get("/api/users")
def get_users(skip: int = 0, limit: int = 10):
    total = db["users"].count_documents({})

    users = list(
        db["users"].find().skip(skip).limit(limit)
    )

    return json.loads(json_util.dumps({
        "total_users": total,
        "returned_users": len(users),
        "users": users
    }))

@app.get("/api/applications")
def get_applications(
    skip: int = 0,
    limit: int = 10,
    x_admin_secret: str = Header(default="")
):

    if not ADMIN_SECRET or not secrets.compare_digest(
        x_admin_secret, ADMIN_SECRET
    ):
        raise HTTPException(
            status_code=401,
            detail="Admin authentication required."
        )
    
    total = db["applications"].count_documents({})

    applications = list(
        db["applications"].find().skip(skip).limit(limit)
    )

    for application in applications:
        job = db["jobs"].find_one({
            "_id": application["jobId"]
        })

        application["jobTitle"] = (
            job["title"] if job else "Job details unavailable"
        )
    
    return json.loads(json_util.dumps({
        "total_applications": total,
        "returned_applications": len(applications),
        "applications": applications
    }))

@app.post("/api/applications")
def submit_application(data: ApplicationRequest):

    user = db["users"].find_one({
        "email": data.email.strip().lower()
    })

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user["name"].strip().lower() != data.name.strip().lower():
        raise HTTPException(status_code=400, detail="Name does not match registered user.")

    if not ObjectId.is_valid(data.jobId):
        raise HTTPException(status_code=400, detail="Invalid job ID.")

    job = db["jobs"].find_one({
        "_id": ObjectId(data.jobId)
    })

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    application = {
        "userId": user["_id"],
        "jobId": job["_id"],
        "status": "Pending",
        "coverLetter": data.coverLetter,
        "appliedAt": datetime.now(timezone.utc)
    }

    result = db["applications"].insert_one(application)

    return {
        "message": "Application submitted successfully!",
        "applicationId": str(result.inserted_id)
    }