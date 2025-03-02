"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
// 環境変数をロード
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // ✅ どこからでも接続可能（本番では制限する）
    },
});
// WebSocket の処理
io.on("connection", (socket) => {
    console.log("⚡️ ユーザーが接続しました");
    socket.on("sendMessage", (message) => {
        console.log("📩 新しいメッセージ:", message);
        io.emit("receiveMessage", message); // ✅ 全クライアントに送信
    });
    socket.on("disconnect", () => {
        console.log("❌ ユーザーが切断しました");
    });
});
// サーバーのポート
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 WebSocket サーバーが起動しました (ポート: ${PORT})`);
});
