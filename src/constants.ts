import "dotenv/config";
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const BACKEND_JWT_REFRESH_TOKEN =
  process.env.BACKEND_JWT_REFRESH_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set.");
  process.exit(1);
}

if (!BACKEND_JWT_REFRESH_TOKEN) {
  console.error("Error: BACKEND_JWT_REFRESH_TOKEN is not set.");
  process.exit(1);
}
