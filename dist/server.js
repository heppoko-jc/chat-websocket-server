"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// chat-websocket-server/server.ts
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: "*" }, // 本番環境では適切に制限してください
});
io.on("connection", (socket) => {
    console.log("⚡️ ユーザーが接続しました:", socket.id);
    // クライアントがチャットルームに参加するとき
    socket.on("joinChat", (chatId) => {
        socket.join(chatId);
        console.log(`🔑 ソケット ${socket.id} がチャット ${chatId} に参加`);
    });
    // メッセージ送信イベント：同じチャットIDのルームにのみ流す
    socket.on("sendMessage", (message) => {
        console.log("📩 新しいメッセージ:", message);
        io.to(message.chatId).emit("newMessage", message);
    });
    // マッチ成立イベント：同じチャットIDのルームにのみ流す
    socket.on("matchEstablished", (data) => {
        console.log("🎉 マッチング成立通知:", data);
        io.to(data.chatId).emit("newMatch", data);
    });
    socket.on("disconnect", () => {
        console.log("❌ ユーザーが切断しました:", socket.id);
    });
});
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 WebSocket サーバーが起動しました (ポート: ${PORT})`);
});
