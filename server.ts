// chat‑websocket‑server/server.ts
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
  cors: {
    origin: "*", // 本番環境では適切なオリジンを指定してください
  },
});

io.on("connection", (socket) => {
  console.log("⚡️ ユーザーが接続しました");

  // クライアントから来たチャットメッセージを全クライアントへ中継
  socket.on("sendMessage", (message) => {
    console.log("📩 新しいメッセージ:", message);
    io.emit("receiveMessage", message);
  });

  // API からのマッチング成立通知を全クライアントへ中継
  socket.on("matchEstablished", (data) => {
    console.log("🎉 マッチング成立通知:", data);
    io.emit("matchEstablished", data);
  });

  // API からの新規メッセージ通知を全クライアントへ中継
  socket.on("newMessage", (data) => {
    console.log("🔔 新規メッセージ通知:", data);
    io.emit("newMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザーが切断しました");
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket サーバーが起動しました (ポート: ${PORT})`);
});
