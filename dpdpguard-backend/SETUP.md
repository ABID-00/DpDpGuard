# DPDPGuard Backend - Complete Setup Guide

## Quick Start (5 minutes)

### Option 1: Using Docker Compose (Recommended for Development)

```bash
# Clone and navigate
cd dpdpguard-backend

# Start MongoDB + API with one command
docker-compose up -d

# Check if running
curl http://localhost:5000/health

# View logs
docker-compose logs -f api
```

**MongoDB will be available at**: `mongodb://admin:password123@localhost:27017/dpdpguard`

### Option 2: Manual Setup (Local Node + MongoDB Atlas)

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Create `.env` File
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dpdpguard
JWT_SECRET=your_generated_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

#### Step 3: Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste in `.env` as `JWT_SECRET`

#### Step 4: Start Server
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

---

## MongoDB Atlas Setup

### Create Free Cluster

1. Go to [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a project "DPDPGuard"
4. Create a cluster:
   - Select **M0 Free Tier**
   - Choose region closest to you
   - Wait 2-3 minutes for provisioning

### Create Database User

1. Click **Database Access** in left menu
2. Click **Add New Database User**
3. Username: `dpdpguard_user`
4. Auto-generate password (copy it!)
5. Select **Builtin Role**: "Read and write to any database"
6. Click **Add User**

### Whitelist IP Address

1. Click **Network Access** in left menu
2. Click **Add IP Address**
3. Select **Allow Access from Anywhere** (or add specific IP)
4. Click **Confirm**

### Get Connection String

1. Click **Databases** → **Connect**
2. Select **Connect your application**
3. Copy connection string
4. Replace `<username>` and `<password>` with your credentials
5. Paste into `.env` as `MONGODB_URI`

---

## Environment Variables Explained

```env
# Server Configuration
PORT=5000                           # Port to run on
NODE_ENV=development                # development or production

# Database
MONGODB_URI=mongodb+srv://...       # MongoDB connection string
DB_NAME=dpdpguard                   # Database name

# JWT/Authentication
JWT_SECRET=<32-char-random-string>  # Secret for token signing
JWT_EXPIRE=7d                       # Token expiry time

# Frontend
FRONTEND_URL=http://localhost:3000  # Frontend URL for CORS

# Agent Configuration
AGENT_API_ENDPOINT=...              # Agent submission endpoint
AGENT_VERIFICATION_KEY=...          # Agent key for verification

# Logging
LOG_LEVEL=debug                     # Log level (debug, info, warn, error)
```

---

## API Testing

### Using Curl

#### 1. Health Check
```bash
curl http://localhost:5000/health
```

#### 2. Register Organization
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Admin User",
    "email": "admin@example.com",
    "password": "Password123",
    "confirmPassword": "Password123",
    "organizationName": "ABC Education Institute",
    "industryType": "Educational Institution"
  }'
```

**Response** (save the token):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...},
  "organization": {...}
}
```

#### 3. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Password123"
  }'
```

#### 4. Get Dashboard (Authenticated)
```bash
curl -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Register Agent
```bash
curl -X POST http://localhost:5000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "AGT-001",
    "hostname": "HR-SERVER-01",
    "assetName": "HR Server",
    "assetType": "Server",
    "registrationKey": "AGENT_REG_KEY_FROM_ORG",
    "os": "Windows Server 2019",
    "osVersion": "10.0.17763"
  }'
```

### Using Postman

1. Download [Postman](https://www.postman.com/downloads/)
2. Import the API requests from `/postman-collection.json` (if provided)
3. Set base URL: `http://localhost:5000`
4. Create environment variables:
   - `token` - JWT token from login
   - `agent_api_key` - API key from agent registration

---

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution:**
- Check MongoDB URI in `.env`
- Verify IP whitelist in MongoDB Atlas
- Ensure cluster is running

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:**
```bash
# Kill process on port 5000
npx kill-port 5000
# Or change PORT in .env
PORT=5001 npm run dev
```

### JWT Secret Not Set
```
Error: JWT_SECRET is not defined
```
**Solution:**
- Generate secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to `.env`

### Docker Issues

**Rebuild container:**
```bash
docker-compose down
docker-compose up --build
```

**View logs:**
```bash
docker-compose logs -f
```

**Access MongoDB in Docker:**
```bash
docker exec -it dpdpguard-mongodb mongosh -u admin -p password123
```

---

## Project Structure

```
dpdpguard-backend/
├── config/
│   └── database.js              # MongoDB connection
├── controllers/
│   ├── authController.js        # Auth logic
│   ├── dashboardController.js   # Dashboard data
│   ├── assetController.js       # Asset CRUD
│   ├── agentController.js       # Agent management
│   ├── assessmentController.js  # Assessment handling
│   ├── gapController.js         # Gap management
│   └── controlController.js     # Control management
├── middleware/
│   ├── auth.js                  # JWT authentication
│   └── errorHandler.js          # Error handling
├── models/
│   ├── User.js                  # User schema
│   ├── Organization.js          # Organization schema
│   ├── Asset.js                 # Asset schema
│   ├── Agent.js                 # Agent schema
│   ├── Assessment.js            # Assessment schema
│   ├── Control.js               # Control schema
│   ├── Gap.js                   # Gap schema
│   ├── ActionPlan.js            # Action Plan schema
│   ├── Vendor.js                # Vendor schema
│   └── Report.js                # Report schema
├── routes/
│   ├── auth.js                  # Auth routes
│   ├── dashboard.js             # Dashboard routes
│   ├── assets.js                # Asset routes
│   ├── agents.js                # Agent routes
│   ├── assessments.js           # Assessment routes
│   ├── controls.js              # Control routes
│   ├── gaps.js                  # Gap routes
│   ├── actionPlan.js            # Action Plan routes
│   ├── vendors.js               # Vendor routes
│   └── reports.js               # Report routes
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore
├── docker-compose.yml           # Docker Compose config
├── Dockerfile                   # Docker container
├── package.json                 # Dependencies
├── README.md                    # Documentation
├── SETUP.md                     # This file
└── server.js                    # Main server
```

---

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
```
Server auto-reloads on file changes (nodemon)

### 2. Make Changes
Edit files in `controllers/`, `routes/`, `models/`

### 3. Test Endpoints
Use Postman, curl, or Insomnia

### 4. Commit Changes
```bash
git add .
git commit -m "Add feature/fix"
git push
```

---

## Production Deployment

### Heroku Deployment

1. **Create Heroku app:**
   ```bash
   heroku create dpdpguard-api
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set JWT_SECRET=xxxxx
   heroku config:set MONGODB_URI=mongodb+srv://...
   heroku config:set NODE_ENV=production
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

4. **View logs:**
   ```bash
   heroku logs --tail
   ```

### AWS/DigitalOcean/Railway Deployment

Instructions for these platforms are similar. Key points:
- Set environment variables
- Use Node.js runtime
- Point to MongoDB Atlas
- Enable HTTPS
- Set CORS origin to frontend URL

---

## Next Steps

1. **Frontend Integration**: Connect React frontend to this API
2. **Agent Development**: Build Python Windows Service that sends evidence
3. **Testing**: Create comprehensive test suite
4. **Documentation**: Generate API documentation (Swagger/OpenAPI)
5. **Monitoring**: Set up error tracking (Sentry) and logging

---

## Support

For issues:
1. Check logs: `npm run dev`
2. Verify MongoDB connection
3. Check environment variables
4. Review error messages in response

Need help? Check README.md for API documentation.
