"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATABASE_URL = exports.PORT = exports.IS_PROD = exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: `.env.${process.env.NODE_ENV || "development"}`
});
exports.ENV = process.env.NODE_ENV || "development";
exports.IS_PROD = exports.ENV === "production";
if (!process.env.PORT) {
    throw new Error("PORT is not defined");
}
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}
exports.PORT = Number(process.env.PORT);
exports.DATABASE_URL = process.env.DATABASE_URL;
