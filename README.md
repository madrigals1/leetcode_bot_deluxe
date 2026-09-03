# 🚀 LeetCode Bot Deluxe

A Telegram bot that tracks LeetCode statistics for users in Telegram groups and channels. It provides leaderboards, user profiles, language stats, submission history, problem breakdowns, and side-by-side user comparisons — all rendered as images via a companion VizAPI service. 📊💬

<!-- TODO: Add a screenshot of the bot in action here -->

## ✨ Features

- **🎯 Track LeetCode users** in any Telegram group or channel
- **🏆 Rankings & leaderboards** with simple and cumulative (weighted) scoring
- **👤 User profiles** with detailed stats (solved problems, submissions, languages)
- **📊 Visual charts** — pie charts, bar charts, comparison images, and submission tables
- **⏰ Contest tracking** with notification subscriptions
- **📑 Pagination** for large result sets (text lists and inline button grids)
- **🔒 Role-based permissions** — regular users, admins, and super admins
- **📈 Prometheus metrics** endpoint for monitoring

## 🧰 Prerequisites

- 🟢 Node.js 22+
- 🤖 A Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- ⚙️ A running [LeetCode Bot Backend](https://github.com/adi-sbyrbayev/leetcode_bot) instance
- 🖼️ A running [VizAPI](https://github.com/adi-sbyrbayev/vizapi) instance

## 🛠️ Setup

1. **📦 Install dependencies**

   ```bash
   npm ci
   ```

2. **🔧 Configure environment variables**

   Copy the example env file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   See [Configuration](#configuration) for all available options.

3. **▶️ Start the bot**

   ```bash
   npm run start
   ```

## ⚙️ Configuration

All configuration is done via environment variables (loaded from `.env`).

### 🔴 Required

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | 🤖 Telegram bot token from BotFather |
| `BACKEND_URL` | 🔗 Base URL of the LeetCode Bot Backend API |
| `BACKEND_JWT_REFRESH_TOKEN` | 🔑 JWT refresh token for backend authentication |
| `VIZAPI_URL` | 🖼️ Base URL of the VizAPI chart generation service |

### 🟡 Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPER_ADMIN_TELEGRAM_USERNAMES` | — | 👑 Comma-separated list of super admin Telegram usernames |
| `TOKEN_MAX_AGE_HOURS` | `20` | ⏳ Hours before the backend JWT access token is refreshed |
| `METRICS_PORT` | `9091` | 📈 Port for the Prometheus metrics endpoint |
| `CML_EASY_POINTS` | — | 🟢 Weight for easy problems in cumulative rating |
| `CML_MEDIUM_POINTS` | — | 🟡 Weight for medium problems in cumulative rating |
| `CML_HARD_POINTS` | — | 🔴 Weight for hard problems in cumulative rating |

## 🐳 Docker Deployment

Build and run using Docker Compose:

```bash
docker compose up -d --build
```

The container exposes the metrics port (`9091` by default) and attaches to an external `leetcode_bot_network` Docker network. 🌐

<!-- TODO: Add a screenshot of the Docker setup or docker-compose output here -->

## 📚 Commands

<!-- TODO: Add screenshots for individual commands here -->

| Command | Description | 🔐 Admin Only |
|---------|-------------|:----------:|
| `/start` | 👋 Welcome message | |
| `/commands` | 📖 List all available commands | |
| `/add <username>` | ➕ Add a LeetCode user to the channel | |
| `/remove [username]` | ➖ Remove a user (interactive picker if no arg) | ✅ Yes |
| `/track <leetcode_username>` | 🔗 Link your Telegram account to a LeetCode username | |
| `/refresh` | 🔄 Refresh data for all tracked users in the channel | |
| `/myrank` | 🏅 Show your ranking in the channel | |
| `/rating` | 📊 Paginated rating leaderboard | |
| `/rating_cml` | ⚖️ Cumulative (weighted) rating leaderboard | |
| `/profile [username]` | 👤 View a user's LeetCode profile | |
| `/avatar [username]` | 🖼️ View a user's LeetCode avatar | |
| `/langstats [username]` | 💻 View language statistics | |
| `/submissions [username]` | ✍️ View recent submissions table | |
| `/problems [username]` | 🍩 View solved problems pie chart | |
| `/compare <user1> <user2>` | 🤜🤛 Side-by-side comparison of two users | |
| `/chatid` | 🆔 Show the current chat ID | ✅ Yes |
| `/botfather` | 🤖 Get commands in BotFather format | 👑 Super Admin |
| `/superadmin` | 📊 View system-wide admin dashboard | 👑 Super Admin |

## 🧑‍💻 Development

```bash
npm run start        # ▶️ Start in dev mode (watch)
npm run start:prod   # 🚀 Start in production mode
npm run lint         # 🧹 Run ESLint
```

The project uses TypeScript with strict mode, ESNext target, and path aliases (`@/*` → `src/*`). 📘
