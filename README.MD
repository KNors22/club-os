# ClubOS

## Project Overview

Student club management inspired by McRUN administrative workflows. Current checkpoint: **0.0.3**. Features below reflect this commit; the architecture describes the complete planned Foundation milestone.

## Features

- React/TypeScript and Express workspaces.
- Node 24 setup, environment validation, MongoDB connectivity, and health endpoint.
- Password authentication, Mongo-backed sessions, logout, and own-profile APIs.
- Club creation, join codes, multi-club enrollment, and tenant isolation.
- Membership status, member search/filtering/pagination, and administrator dashboard APIs.
- Registration/login and profile screens with protected navigation.
- Club onboarding and workspace selection screens.
- Responsive administrator/member dashboards and membership views.

## Installation Instructions

Requires Node.js 24 and a running MongoDB 7+ instance.

```bash
nvm use
npm ci
npm run setup
npm run dev
```

Setup creates an ignored root `.env` without overwriting one. Set `MONGODB_URI` if needed. Open http://localhost:5173; API health is http://localhost:3000/api/health. Use the configured `APP_URL` origin for write requests. Startup never resets application data.

## Usage

Register or sign in, then use the screens currently available above. More club screens are introduced in subsequent commits.

## Technologies Used

React, TypeScript, Vite, Node.js, Express, MongoDB, Mongoose, and Zod.

## Development

Run `npm run check` for the checks available at this checkpoint. Feature tests are introduced with their implementations. Tests use disposable data, never the application database.

## Future Improvements

Complete remaining Foundation screens and delivery checks, then add payments, renewals, events, attendance, and email.

## Development Notes

See [architecture](docs/architecture.md), [devlog](docs/devlog.md), and [changelog](CHANGELOG.MD). Live hosting has not been provisioned.

## Author and License

Andrey Gonzalez. [MIT License](LICENSE).
