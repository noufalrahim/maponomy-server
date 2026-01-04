import dotenv from "dotenv"

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`
})

export const ENV = process.env.NODE_ENV || "development"
export const IS_PROD = ENV === "production"

if (!process.env.PORT) {
  throw new Error("PORT is not defined")
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined")
}

export const PORT = Number(process.env.PORT)
export const DATABASE_URL = process.env.DATABASE_URL
