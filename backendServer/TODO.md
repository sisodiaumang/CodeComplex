# DevWar Backend Roadmap - TODO

## Phase 1: Finish Backend Infrastructure
- [ ] (1) Logger (pino-http + request/error + socket logging)
- [ ] (2) Environment validation + central config usage (`src/config/env.ts`)
- [ ] (3) Security middleware wiring (helmet, compression, hpp, express-rate-limit, cors)
- [ ] (4) Zod validation utility + refactor critical controllers to schemas

## Phase 2: Test Everything with Postman/Bruno
- [ ] Create Postman/Bruno collection (or checklist) for:
  - [ ] Signup → OTP → Login
  - [ ] Create Battle → Join Battle → Start Match
  - [ ] Submit Code → Rating Update → Notification
  - [ ] Achievement → Leaderboard

## Phase 3: Socket Testing
- [ ] Add socket test scripts for:
  - [ ] battle creation/join
  - [ ] team chat + global (!!)
  - [ ] typing indicator, spectating
  - [ ] notifications + friend online/offline

## Phase 4: Background Jobs
- [ ] Ensure cron jobs cover:
  - [ ] expired OTP cleanup
  - [ ] expired refresh tokens
  - [ ] expired temporary bans
  - [ ] old unverified users
  - [ ] old notifications
  - [ ] stale battle rooms

## Phase 5: API Documentation
- [ ] Add Swagger/OpenAPI docs endpoint
- [ ] Generate docs before frontend work

## Phase 6: Unit Tests
- [ ] Add unit/integration tests for:
  - [ ] Auth
  - [ ] Match start
  - [ ] Submission + judgement
  - [ ] Rating updates

## Final: README
- [ ] Write backend README (architecture diagram, folder structure, API + socket events, env vars, run locally)

