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
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const server_1 = require("./server");
console.log("Running in:", env_1.ENV);
function bootstrap() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.connectToDatabase)();
        (0, server_1.startHttpServer)();
    });
}
function shutdown(signal) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Received ${signal}. Shutting down...`);
        try {
            yield (0, server_1.stopHttpServer)();
            yield database_1.pool.end();
            process.exit(0);
        }
        catch (err) {
            console.error("Shutdown error", err);
            process.exit(1);
        }
    });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
bootstrap();
