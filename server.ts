import { Server } from "socket.io";
import express from "express";
import http from "http";
import cors from "cors";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("⚡️ ユーザーが接続しました");

  socket.on("sendMessage", (message) => {
    console.log("📩 新しいメッセージ:", message);
    io.emit("receiveMessage", message); // ✅ すべてのクライアントに送信
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザーが切断しました");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 WebSocket サーバー起動 (ポート: ${PORT})`));