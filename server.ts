// chat-websocket-server/server.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }, // 本番環境では適切に制限してください
});

io.on("connection", (socket) => {
  console.log("⚡️ ユーザーが接続しました:", socket.id);

  // クライアントがチャットルームに参加するとき
  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
    console.log(`🔑 ソケット ${socket.id} がチャット ${chatId} に参加`);
  });

  // メッセージ送信イベント：同じチャットIDのルームにのみ流す
  socket.on("sendMessage", (message: { chatId: string; [key: string]: any }) => {
    console.log("📩 新しいメッセージ:", message);
    io.to(message.chatId).emit("newMessage", message);
  });

  // マッチ成立イベント：同じチャットIDのルームにのみ流す
  socket.on("matchEstablished", (data: { chatId: string; [key: string]: any }) => {
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