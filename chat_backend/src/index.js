import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import friendRoutes from "./routes/friend.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

// app.use(express.json());
app.use(express.json({ limit: "10mb" })); // size ကို မင်းလိုချင်သလိုချိန်
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(cookieParser());
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );
// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );

app.use(

  cors({   
    //  origin: ["http://localhost:5173","http://192.168.91.75:5173", 
    //   "http://192.168.45.189:5173","http://192.168.45.203:5173",
    //   "http://192.168.47.72:5173","http://192.168.45.84:5173","http://172.19.8.32:5173"
    // ],
      origin: process.env.CLIENT_URL,

    credentials: true,
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/friends", friendRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, "0.0.0.0", () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
