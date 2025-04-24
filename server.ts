// chat-websocket-server/server.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// 環境変数をロード
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// WebSocket の処理
io.on("connection", (socket) => {
  console.log("⚡️ ユーザーが接続しました");

  socket.on("sendMessage", (message) => {
    console.log("📩 新しいメッセージ:", message);
    io.emit("receiveMessage", message); // UI 更新用
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザーが切断しました");
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket サーバーが起動しました (ポート: ${PORT})`);
});