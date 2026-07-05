# DevArena Backend API

A competitive coding battle platform backend built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- npm or yarn
- Redis (optional, for queue management)

### Installation

```bash
cd backendServer
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:8000` by default.

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
backendServer/
├── src/
│   ├── bootstrap.ts           # Entry point (loads .env)
│   ├── index.ts               # Express app setup & server start
│   ├── config/
│   │   └── env.ts             # Centralized environment validation (Zod)
│   ├── controllers/           # Request handlers
│   ├── routes/                # Route definitions
│   ├── models/                # MongoDB schemas
│   ├── interfaces/            # TypeScript interfaces
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts      # Zod request validation
│   │   ├── error.middleware.ts
│   │   ├── socketAuth.middleware.ts
│   │   └── uploadSingleImage.middleware.ts
│   ├── validators/            # Zod schemas for request validation
│   ├── services/              # Business logic
│   ├── sockets/               # Socket.IO event handlers
│   ├── jobs/                  # Background cron jobs
│   ├── utils/
│   │   ├── ApiError.ts        # Custom error class
│   │   ├── ApiResponse.ts     # Standard response format
│   │   ├── asyncHandler.ts    # Async/await error wrapper
│   │   ├── cloudinary.ts      # Image upload service
│   │   └── logger.ts          # Pino logger setup
│   ├── constants/
│   └── db/
│       └── connectDB.ts
├── openapi.yaml               # API documentation (OpenAPI 3.0)
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security Features

- **Helmet**: Secure HTTP headers
- **Compression**: Response compression
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **HPP**: HTTP Parameter Pollution prevention
- **CORS**: Configurable Cross-Origin Resource Sharing
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Request Validation**: Zod schemas on all critical endpoints

## 🔌 API Routes

All API routes are prefixed with `/api/v1/`.

### Authentication
- `POST /user/signup` - Register new user
- `POST /user/signup/verify` - Verify with OTP
- `POST /user/login` - Login
- `POST /user/logout` - Logout
- `POST /user/refresh-token` - Refresh access token
- `POST /user/password/forgot` - Request password reset
- `POST /user/password/reset` - Reset password
- `PATCH /user/password/change` - Change password (authenticated)

### User Account
- `GET /user/me` - Get current user profile (authenticated)
- `GET /user/:username` - Get public user profile
- `PATCH /user/avatar` - Upload profile picture (authenticated)
- `PATCH /user/bio` - Update bio (authenticated)
- `PATCH /user/country` - Update country (authenticated)
- `DELETE /user/account` - Delete account (authenticated)

### Battle
- `POST /battle` - Create battle room (authenticated)
- `GET /battle/:roomCode` - Get room details (authenticated)
- `POST /battle/:roomCode/join` - Join room (authenticated)
- `POST /battle/:roomCode/leave` - Leave room (authenticated)
- `POST /battle/:roomCode/team-a` - Join Team A (authenticated)
- `POST /battle/:roomCode/team-b` - Join Team B (authenticated)
- `POST /battle/:roomCode/start` - Start battle (authenticated)
- `DELETE /battle/:roomCode` - Delete room (authenticated)

### Match
- `POST /match/start` - Start new match (authenticated)
- `GET /match/current` - Get current match (authenticated)
- `GET /match/history` - Get match history (authenticated)
- `GET /match/:matchId` - Get match details (authenticated)
- `GET /match/:matchId/live` - Get live match data (authenticated)
- `POST /match/:matchId/end` - End match (authenticated)
- `POST /match/:matchId/abandon` - Abandon match (authenticated)

### Submission
- `POST /submission` - Submit code (authenticated)
- `GET /submission/me` - Get my submissions (authenticated)
- `GET /submission/match/:matchId` - Get match submissions (authenticated)
- `GET /submission/:submissionId` - Get submission details (authenticated)
- `POST /submission/:submissionId/rejudge` - Rejudge submission (authenticated)
- `DELETE /submission/:submissionId` - Delete submission (authenticated)

### Rating & Leaderboard
- `GET /ratings/me` - Get my rating (authenticated)
- `GET /ratings/history` - Get rating history (authenticated)
- `GET /ratings/leaderboard` - Get global leaderboard
- `GET /ratings/user/:username` - Get user rating
- `GET /ratings/match/:matchId` - Get match rating changes (authenticated)
- `GET /leaderboard/global` - Global rankings
- `GET /leaderboard/country` - Country rankings
- `GET /leaderboard/friends` - Friends rankings (authenticated)
- `GET /leaderboard/weekly` - Weekly rankings
- `GET /leaderboard/monthly` - Monthly rankings
- `GET /leaderboard/college` - College rankings

### Friends
- `POST /friends/request/:userId` - Send friend request (authenticated)
- `PATCH /friends/request/:requestId/accept` - Accept request (authenticated)
- `PATCH /friends/request/:requestId/reject` - Reject request (authenticated)
- `DELETE /friends/request/:requestId` - Cancel request (authenticated)
- `GET /friends` - Get friends list (authenticated)
- `GET /friends/requests/incoming` - Get incoming requests (authenticated)
- `GET /friends/requests/outgoing` - Get outgoing requests (authenticated)
- `DELETE /friends/:friendId` - Remove friend (authenticated)
- `GET /friends/mutual/:userId` - Get mutual friends (authenticated)
- `GET /friends/status/:userId` - Get friendship status (authenticated)
- `GET /friends/search` - Search friends (authenticated)

### Notifications
- `GET /notifications` - Get notifications (authenticated)
- `GET /notifications/:notificationId` - Get notification (authenticated)
- `PATCH /notifications/:notificationId/read` - Mark as read (authenticated)
- `PATCH /notifications/read-all` - Mark all as read (authenticated)
- `DELETE /notifications/:notificationId` - Delete notification (authenticated)
- `DELETE /notifications` - Delete all (authenticated)

### Achievements
- `GET /achievements/me` - Get my achievements (authenticated)
- `GET /achievements/progress` - Get achievement progress (authenticated)
- `GET /achievements/categories` - Get categories
- `GET /achievements/user/:username` - Get user achievements
- `GET /achievements/:achievementId` - Get achievement details

### Spectate
- `GET /spectate/:matchId` - Get spectate data
- `GET /spectate/:matchId/live` - Get live spectate updates

## 🔌 Socket.IO Events

Socket.IO runs on the same port (8000) with separate authentication.

### Battle Chat
- `battle:chat:join` - Join chat for a room
- `battle:chat:send` - Send message (prefixed with `!!` for global)
- `battle:chat:message` - Receive message
- `battle:chat:error` - Chat error

### Battle Voice
- Event handlers for battle voice communication

### Notifications
- `user:online` - User comes online
- `user:offline` - User goes offline
- `battle:started` - Battle starts
- `match:started` - Match starts
- `submission:judged` - Submission judging complete
- `score:updated` - Score changes
- `match:ended` - Match ends

## 📊 Database Models

- **User** - User account and profile
- **UserProfile** - Extended profile information
- **OTP** - One-time passwords for verification
- **RefreshToken** - Stored refresh tokens
- **BattleRoom** - Battle room state
- **Match** - Match records
- **Submission** - Code submissions
- **Submission** - Question/problem data
- **Achievement** - Achievement definitions & user progress
- **Notification** - User notifications
- **Friendship** - Friend relationships
- **Rating** - ELO rating history
- **RatingHistory** - Rating change records

## 🗂️ Background Jobs (Cron)

All cron jobs are started automatically on server startup:

1. **Clean Unverified Users** - Runs daily at 1 AM
   - Deletes users who haven't verified email after 7 days

2. **Rating Recovery** - Runs daily at 4 AM
   - Recovers ratings for users with temporary bans

3. **Refresh Token Cleanup** - Runs daily at 2 AM
   - Removes expired refresh tokens

4. **OTP Cleanup** - Runs every 6 hours
   - Removes expired OTPs

5. **Notification Cleanup** - Runs daily at 3 AM
   - Deletes notifications older than 30 days

6. **Stale Battle Room Cleanup** - Runs every 30 minutes
   - Removes battle rooms in WAITING status for over 1 hour

## 🔑 Authentication

### Token Flow

1. **Signup** → User provides credentials, receives OTP
2. **OTP Verification** → User verifies email, account created
3. **Login** → User receives `accessToken` (15m) and `refreshToken` (7d)
4. **Authenticated Requests** → Send `Authorization: Bearer <accessToken>`
5. **Token Expiry** → Use `refreshToken` to get new `accessToken`

### JWT Claims

```json
{
  "_id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## 📝 Request/Response Format

### Success Response

```json
{
  "success": true,
  "data": { },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### Validation Error Response

```json
{
  "success": false,
  "error": "Validation failed: email: Invalid email, password: String must be at least 8 characters",
  "statusCode": 400
}
```

## 🧪 Testing

### Manual Testing
Use Postman or Bruno with the OpenAPI spec:
- Import `openapi.yaml` into Postman/Bruno
- Set environment variable for `baseUrl` (default: `http://localhost:8000`)
- Set environment variable for `token` after login

### Postman Collection Import
1. Open Postman
2. Click "Import"
3. Select `openapi.yaml`
4. Collection auto-populated with all endpoints

## 📊 Logging

Logs are configured with Pino:

- **Development**: Pretty-printed console output with colors
- **Production**: JSON-formatted logs for log aggregation

### Redacted Fields
- Authorization headers
- Cookies
- Passwords
- Tokens

## ⚙️ Configuration

### Environment Variables

See `.env.example` for complete list. Key variables:

```
# Server
PORT=8000
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/devarena

# JWT
JWT_ACCESS_SECRET=your_secret_key_min_10_chars
JWT_REFRESH_SECRET=your_secret_key_min_10_chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# External Services
JUDGE0_API_URL=http://localhost:2358
XAI_API_KEY=your_grok_api_key
RESEND_API_KEY=your_resend_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud
```

## 🚨 Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized / Invalid Token |
| 403 | Forbidden / Insufficient Permissions |
| 404 | Not Found |
| 409 | Conflict / Duplicate Entry |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

## 📚 API Documentation

Full API documentation available in OpenAPI 3.0 format:
- File: `openapi.yaml`
- View in [Swagger Editor](https://editor.swagger.io/) (upload file)
- View in [Redoc](https://redocly.github.io/redoc/) (upload file)

## 🔄 Development Workflow

1. Create feature branch
2. Make changes to `src/` files
3. Run `npm run dev` (hot-reload with tsx)
4. Update validators if adding new endpoints
5. Add Zod schema to route
6. Commit and push

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
```

Outputs to `dist/` directory with compiled JavaScript.

### Run Production Build

```bash
npm start
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify database name in connection string

### Port Already in Use
```bash
# Find process on port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

### JWT Token Expired
- Use `refreshToken` endpoint to get new `accessToken`
- Check token expiry time in `.env`

### Rate Limiting Issues
- Default: 100 requests per 15 minutes per IP
- Update limit in `src/index.ts` if needed

## 🤝 Contributing

1. Follow existing code style
2. Add Zod validation for new endpoints
3. Update OpenAPI spec
4. Write tests if possible
5. Document any new environment variables

## 📝 License

ISC

## 👥 Support

For issues or questions:
1. Check existing GitHub issues
2. Create detailed issue with reproduction steps
3. Include `node -v`, `npm -v`, and MongoDB version
4. Attach relevant logs from `logs/` directory

---

**Last Updated**: July 2026
