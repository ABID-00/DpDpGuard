# DPDPGuard Backend API

**Evidence-based DPDP Readiness & Assurance Platform**

## Overview

DPDPGuard is a comprehensive backend API built with Node.js, Express, and MongoDB that provides:

- **User Authentication & Authorization**
- **Organization Management**
- **Asset & Inventory Tracking**
- **Assurance Agent Management**
- **Assessment Engine**
- **Gap Analysis & Tracking**
- **Vendor Assurance**
- **Readiness Scoring & Reports**

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT
- **Validation**: Joi (optional)

## Installation

### Prerequisites

- Node.js 14+ 
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd dpdpguard-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set MongoDB Connection String**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dpdpguard
   ```

5. **Generate JWT Secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Copy output to JWT_SECRET in .env
   ```

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

Server will start on `http://localhost:5000` (or your configured PORT)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Dashboard
- `GET /api/dashboard` - Get dashboard overview
- `GET /api/dashboard/trend` - Get readiness trend

### Assets
- `GET /api/assets` - List all assets
- `POST /api/assets` - Create asset
- `GET /api/assets/:id` - Get asset details
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset
- `GET /api/assets/stats` - Get asset statistics

### Agents
- `POST /api/agents/register` - Register new agent
- `POST /api/agents/evidence` - Submit evidence (requires API key)
- `GET /api/agents` - List agents
- `GET /api/agents/:id` - Get agent details
- `PUT /api/agents/:id/status` - Update agent status
- `POST /api/agents/:id/rotate-key` - Rotate API key

### Assessments
- `GET /api/assessments` - List assessments
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/:id` - Get assessment
- `PUT /api/assessments/:id` - Update assessment
- `POST /api/assessments/:id/submit` - Submit assessment

### Controls
- `GET /api/controls` - List controls
- `GET /api/controls/:id` - Get control
- `PUT /api/controls/:id` - Update control
- `GET /api/controls/stats` - Get control stats

### Gaps
- `GET /api/gaps` - List gaps
- `POST /api/gaps` - Create gap
- `GET /api/gaps/:id` - Get gap
- `PUT /api/gaps/:id` - Update gap
- `PATCH /api/gaps/:id/status` - Update gap status
- `DELETE /api/gaps/:id` - Delete gap
- `GET /api/gaps/stats` - Get gap stats

### Action Plan
- `GET /api/action-plan` - List actions
- `GET /api/action-plan/:id` - Get action
- `PUT /api/action-plan/:id` - Update action

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:id` - Get vendor
- `PUT /api/vendors/:id` - Update vendor

### Reports
- `GET /api/reports` - List reports
- `POST /api/reports` - Generate report
- `GET /api/reports/:id` - Get report

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Example:
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Agent Integration

### Agent Registration Flow

1. Organization generates `agentRegistrationKey` 
2. Agent calls `POST /api/agents/register` with:
   - agentId
   - hostname
   - registrationKey
   - os, osVersion

3. Backend returns `apiKey` for agent

4. Agent submits evidence via `POST /api/agents/evidence` with:
   - X-API-Key header
   - agentId
   - evidence array
   - os, osVersion

### Example Agent Integration (Python)
```python
import requests
import json

API_KEY = "agent_api_key_here"
AGENT_ID = "AGT-001"
BACKEND_URL = "http://localhost:5000/api/agents/evidence"

evidence_data = {
    "agentId": AGENT_ID,
    "evidence": ["Encryption", "Access Control", "Logging", "Backup"],
    "os": "Windows Server 2019",
    "osVersion": "10.0.17763"
}

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

response = requests.post(BACKEND_URL, json=evidence_data, headers=headers)
print(response.json())
```

## MongoDB Schema

Models included:
- **User** - System users with roles
- **Organization** - Customer organizations
- **Asset** - Computers, servers, applications
- **Agent** - Assurance agents installed on assets
- **Assessment** - DPDP questionnaire responses
- **Control** - Security controls
- **Gap** - Identified gaps/risks
- **ActionPlan** - Remediation actions
- **Vendor** - Third-party vendors
- **Report** - Generated reports

## Error Handling

API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": ["Additional info if applicable"]
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://...
DB_NAME=dpdpguard

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

## Deployment

### Heroku
```bash
heroku create dpdpguard-api
heroku config:set JWT_SECRET=xxx
git push heroku main
```

### Docker
```bash
docker build -t dpdpguard-api .
docker run -p 5000:5000 -e MONGODB_URI=... dpdpguard-api
```

## Testing

Test endpoints with Postman, curl, or Insomnia:

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin",
    "email": "admin@example.com",
    "password": "Test123",
    "confirmPassword": "Test123",
    "organizationName": "Test Org",
    "industryType": "Educational Institution"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Test123"
  }'
```

## Project Structure

```
dpdpguard-backend/
├── config/          # Database config
├── controllers/     # Route handlers
├── middleware/      # Auth, error handling
├── models/          # MongoDB schemas
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utilities
├── .env.example     # Environment template
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # Documentation
```

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT

## Support

For issues or questions, contact the development team.
