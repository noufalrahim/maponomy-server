"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.connectToDatabase = connectToDatabase;
const pg_1 = require("pg");
const env_1 = require("./env");
const dbUrl = new URL(env_1.DATABASE_URL);
exports.pool = new pg_1.Pool({
    connectionString: env_1.DATABASE_URL,
});
function connectToDatabase() {
    return __awaiter(this, arguments, void 0, function* (retries = 10, delayMs = 2000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const client = yield exports.pool.connect();
                console.log("Database connected successfully");
                console.log(`DB Host      : ${dbUrl.hostname}`);
                console.log(`DB Port      : ${dbUrl.port || "5432"}`);
                console.log(`DB Name      : ${dbUrl.pathname.replace("/", "")}`);
                client.release();
                return;
            }
            catch (err) {
                console.error(`Database connection attempt ${attempt}/${retries} failed`);
                if (attempt === retries) {
                    console.error("Database unreachable. Exiting.");
                    process.exit(1);
                }
                yield new Promise(res => setTimeout(res, delayMs));
            }
        }
    });
}
