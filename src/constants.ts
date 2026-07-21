import "dotenv/config";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`Error: ${key} is not set.`);
    process.exit(1);
  }
  return value;
}

function getEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const TELEGRAM_BOT_TOKEN = getRequiredEnv("TELEGRAM_BOT_TOKEN");
export const BACKEND_JWT_REFRESH_TOKEN = getRequiredEnv(
  "BACKEND_JWT_REFRESH_TOKEN",
);
export const BACKEND_URL = getRequiredEnv("BACKEND_URL");
export const TOKEN_MAX_AGE_MS =
  Number(getEnv("TOKEN_MAX_AGE_HOURS", "20")) * 60 * 60 * 1000;

export const CML_EASY_POINTS = getEnv("CML_EASY_POINTS", "0.5");
export const CML_MEDIUM_POINTS = getEnv("CML_MEDIUM_POINTS", "1.5");
export const CML_HARD_POINTS = getEnv("CML_HARD_POINTS", "5");
