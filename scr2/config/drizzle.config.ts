import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  override: true,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const dbUrl = new URL(process.env.DATABASE_URL);

const host = dbUrl.hostname;
const port = Number(dbUrl.port || 5432);
const database = dbUrl.pathname.replace("/", "");
const user = dbUrl.username;
const password = dbUrl.password;
const ssl = dbUrl.searchParams.get("ssl") === "true";

console.log("DB Host      :", host);
console.log("DB Port      :", port);
console.log("DB Name      :", database);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host,
    port,
    database,
    user,
    password,
    ssl,
  },
});
