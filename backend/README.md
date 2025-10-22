# Laser Tag Webpage Backend

Node.js + Express + MongoDB backend for looking up a student's details by roll number for the Laser Tag event.

## What it does

- Imports student data from the JSON file into MongoDB (database `lasertag`, collection `students`).
- Exposes the API endpoint `GET /student/:rollNumber` to fetch a single student.
- Optional `GET /students` to fetch up to 1000 students (for testing).
- CORS enabled. Simple request logging with timestamps.

## Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Project structure

- `src/server.js` — Express server with routes
- `src/db.js` — MongoDB connection helper and index creation
- `src/importData.js` — JSON import/upsert script
- `.env.example` — Sample environment configuration
- `package.json` — scripts and dependencies

The data file is expected at `../contacts_rolls.json` relative to this backend folder by default. You can override this via `.env`.

## Setup

1. Copy the sample env and edit as necessary:

```
copy .env.example .env
```

2. Install dependencies:

```
npm install
```

3. Ensure MongoDB is running. Default URI is `mongodb://127.0.0.1:27017`.

## Run the server

```
npm start
```

On first start, the server will import the JSON data into MongoDB (upsert by `rollNumber`) and then listen on `http://localhost:3000` (configurable via `PORT`).

## Seed data without starting the server

```
npm run seed
```

## API Examples (Windows cmd)

- Find a student by roll number:

```
curl http://localhost:3000/student/21BTB0A01
```

Expected response:

```
{
  "rollNumber": "21BTB0A01",
  "name": "KAGITHA VISHNU SAI",
  "email": "kv21btb0a01@student.nitw.ac.in",
  "mobile": "9014571989"
}
```

- If not found:

```
curl http://localhost:3000/student/NOTEXIST
```

Response:

```
{"error":"Student with roll number NOTEXIST not found"}
```

- Get up to 1000 students (testing):

```
curl http://localhost:3000/students
```

## Notes

- The code ensures a unique index on `students.rollNumber`.
- The importer normalizes your JSON records from `{ roll, name, email, mobile }` to `{ rollNumber, name, email, mobile }`.
- Update `.env` if your MongoDB URL, database, collection, or data path differs.
