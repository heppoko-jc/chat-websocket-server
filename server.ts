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