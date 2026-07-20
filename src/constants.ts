import "dotenv/config";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Error: ${key} is not set.`);
    process.exit(1);
  }
  return value;
}

export const TELEGRAM_BOT_TOKEN = getRequiredEnv("TELEGRAM_BOT_TOKEN");
export const BACKEND_JWT_REFRESH_TOKEN = getRequiredEnv(
  "BACKEND_JWT_REFRESH_TOKEN",
);
export const BACKEND_URL = getRequiredEnv("BACKEND_URL");
