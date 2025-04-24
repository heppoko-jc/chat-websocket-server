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
  cors: { origin: "*" }, // 開発中はワイルドカード、本番では適切に制限してください
});

io.on("connection", (socket) => {
  console.log("⚡️ ユーザーが接続しました:", socket.id);

  // クライアントが sendMessage を emit してきたら、
  // 全クライアントに newMessage イベントで流す
  socket.on("sendMessage", (message) => {
    console.log("📩 新しいメッセージ:", message);
    io.emit("newMessage", message);
  });

  // 将来、マッチ成立時に API サーバー側から "matchEstablished" イベントを受け取ったら
  // 全クライアントに newMatch イベントで通知
  socket.on("matchEstablished", (data) => {
    console.log("🎉 マッチング成立通知:", data);
    io.emit("newMatch", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザーが切断しました:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket サーバーが起動しました (ポート: ${PORT})`);
});