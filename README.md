# ✈️ SkyMate – AI-Powered Flight Assistant

SkyMate is a full-stack AI-powered travel assistant that provides real-time flight information, personalized insights, and intelligent travel planning using live aviation data and tool-based AI orchestration.

---

## 🚀 Features

- 🔐 User authentication (Login / Signup with JWT)
- ✈️ Search real-time flights (departures, arrivals, status)
- 📌 Track and manage flights
- 🤖 AI Assistant with contextual understanding
- 🧠 MCP-based tool orchestration for dynamic AI responses
- 🌐 Live aviation data integration (AviationStack API)
- 🧩 Multi-step reasoning (e.g., delayed tracked flights)
- 🐳 Fully containerized using Docker

---

<img width="1470" height="810" alt="Screenshot 2026-04-09 at 6 50 36 PM" src="https://github.com/user-attachments/assets/0f2a307b-edcd-47ef-b5c6-479ebe100358" />
<img width="1453" height="809" alt="Screenshot 2026-04-09 at 6 50 25 PM" src="https://github.com/user-attachments/assets/5d9f9f93-b212-4dd3-ada1-f74af70c4c0a" />
<img width="1457" height="810" alt="Screenshot 2026-04-09 at 6 49 38 PM" src="https://github.com/user-attachments/assets/a9a671d0-7826-4517-ac74-731d7061712d" />
<img width="1453" height="810" alt="Screenshot 2026-04-09 at 6 49 20 PM" src="https://github.com/user-attachments/assets/20cb2dbd-abb5-4448-ae9a-a4713311dd07" />
<img width="1452" height="813" alt="Screenshot 2026-04-09 at 6 49 01 PM" src="https://github.com/user-attachments/assets/0fb9eabf-b9dc-4eb4-91d1-b5ae153e9a32" />
<img width="1455" height="810" alt="Screenshot 2026-04-09 at 6 48 43 PM" src="https://github.com/user-attachments/assets/ac27ab67-41b3-4d8f-b0d8-9af512765c0f" />
<img width="1454" height="811" alt="Screenshot 2026-04-09 at 6 48 31 PM" src="https://github.com/user-attachments/assets/b30c2931-b479-4805-8b24-b032acf4cb57" />
<img width="1470" height="814" alt="Screenshot 2026-04-09 at 6 47 40 PM" src="https://github.com/user-attachments/assets/f487df55-3622-4897-b599-413aaa02e551" />
<img width="1470" height="810" alt="Screenshot 2026-04-09 at 6 46 51 PM" src="https://github.com/user-attachments/assets/8616380a-77b2-4a45-8281-97ed0ae63e83" />
<img width="1454" height="811" alt="Screenshot 2026-04-09 at 6 46 33 PM" src="https://github.com/user-attachments/assets/43008f12-91eb-4882-96dd-c325595501ff" />


---

## 🧱 Tech Stack

### Frontend
- Next.js (React)
- Tailwind CSS
- Axios

### Backend
- FastAPI
- MySQL
- SQLAlchemy
- JWT Authentication

### AI & Tools
- OpenAI API
- MCP (Model Context Protocol)
- Custom tool orchestration layer

### DevOps
- Docker
- Docker Compose

---

## 🏗️ Architecture

Frontend (Next.js)
↓
Backend API (FastAPI)
↓
AI Orchestrator
↓
MCP Server (Tools)
↓
AviationStack API

---

## 🤖 AI Capabilities

SkyMate uses tool-based AI reasoning instead of plain text responses.

### Supported Tools
- `search_departures`
- `search_arrivals`
- `search_flight_status`
- `build_arrival_plan`
- `get_tracked_flights_local`

### Example Queries
- "Show departures from SFO"
- "Tell me about this flight"
- "Which of my tracked flights are delayed?"
- "Give me a travel plan after landing"

---

## 🐳 Running with Docker

### 1. Clone the repo

```bash
git clone https://github.com/your-username/skymate.git
cd skymate
```

### 2. Create .env file (root)
```
OPENAI_API_KEY=your_openai_key
AVIATIONSTACK_API_KEY=your_aviationstack_key
```

### 3. Start the application
Using Docker: 
```
docker compose up --build
```

Using Locally: 
Backend:
```
  cd backend
  source venv/bin/activate
  uvicorn app.main:app --reload
```

Frontend:
```
  cd frontend
  run dev
```

MCP server: 
```
  cd mcp-server
  python server.py
```

### 4. Access the app

Frontend → http://localhost:3000
Backend → http://localhost:8000/docs
MCP Server → http://localhost:8001

---

## 📂 Project Structure

SkyMate/
├── frontend/        # Next.js app
├── backend/         # FastAPI server
├── mcp-server/      # MCP tools server
├── docker-compose.yml
└── README.md

---

## ⭐ Key Highlights
- 🔥 Real-time flight data integration
- 🧠 Context-aware AI assistant
- 🔄 Multi-tool orchestration (MCP)
- ⚡ Optimized with caching for performance
- 🐳 Fully Dockerized for easy setup

---

## 📌 Future Improvements
- Deployment (Vercel + Render/AWS)
- CI/CD pipelines
- Enhanced UI/UX
- Persistent caching (Redis)
- Advanced recommendation system


## 👩‍💻 Author

Arpita Misal
Software Engineering Student @ San José State University

## 💬 Inspiration

Built to explore the intersection of:
- AI + real-world data
- tool-based reasoning (MCP)
- full-stack system design



