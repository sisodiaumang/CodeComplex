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

## Model hardening (DevWar Questions)
- [ ] Fix text index to include correct fields (metadata.*) and add name to index
- [ ] Strengthen validation: every supported language must have starterCode/functionSignature/solutions (as applicable)
- [ ] Detect duplicate testcases by (input+output) in addition to id
- [ ] Prevent slug collisions by using a unique slug strategy (append short suffix on collision)
- [ ] Fix auditing fields: createdBy/updatedBy type to ObjectId ref User; add corresponding indexes
- [ ] Constrain interviewFrequency (min/max)
- [ ] Use enums for revisionLevel and category
- [ ] Add soft-delete relevant indexes (isDeleted)
- [ ] Validate starterCode != buggyStarterCode in bug_fix mode

## Final: README
- [ ] Write backend README (architecture diagram, folder structure, API + socket events, env vars, run locally)

