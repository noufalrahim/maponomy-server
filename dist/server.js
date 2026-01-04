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
exports.startHttpServer = startHttpServer;
exports.stopHttpServer = stopHttpServer;
const env_1 = require("./config/env");
const app_1 = require("./app");
let server;
function startHttpServer() {
    const app = (0, app_1.createApp)();
    server = app.listen(env_1.PORT, () => {
        console.log(`Server running on port ${env_1.PORT}`);
    });
}
function stopHttpServer() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!server)
            return;
        return new Promise((resolve, reject) => {
            server.close(err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    });
}
