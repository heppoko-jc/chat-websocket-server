import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const PORT: number = Number(process.env.PORT) || 3001;

const io = new Server({
  cors: {
    origin: "*", // すべてのオリジンを許可（本番環境では制限する）
  },
});

io.on("connection", (socket) => {
  console.log("✅ ユーザーが接続:", socket.id);

  socket.on("message", (data) => {
    console.log("💬 メッセージ受信:", data);
    io.emit("message", data); // すべてのクライアントに送信
  });

  socket.on("disconnect", () => {
    console.log("❌ ユーザーが切断:", socket.id);
  });
});

io.listen(PORT);

console.log(`🚀 WebSocket サーバーがポート ${PORT} で起動しました！`);