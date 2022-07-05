const express = require("express");
const http = require("http");
const app = express();
const User = require("./models/user");
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const producsRoutes = require("./routes/Prodcutsroutes");
const PORT = 3007;
const Message = require("./models/messageModel");
const cors = require("cors");
const socket = require("socket.io");
const mongoose = require("mongoose");

require("dotenv").config();

mongoose.connect("mongodb://127.0.0.1:27017/testDb").then(() => {
  console.log("mongodb connected");
});

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use(cors(), express.json());
app.use("/user", userRoutes);
app.use("/products", producsRoutes);

const server = app.listen(PORT, (req, res) => {
  console.log("server start");
});

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    cridentials: true,
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });
  socket.on("get-all-msg", async (data) => {
    // send a message to the client
    const { fromUser, to } = data;
    const messages = await Message.find({
      users: {
        $all: [fromUser, to],
      },
    }).sort({ updatedAt: 1 });
    // pagination

    const projectMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === fromUser,
        message: msg.message,
      };
    });

    socket.emit("projectMessages", projectMessages);
    // res.json(projectMessages);
  }),
    socket.on("send-msg", async (data) => {
      try {
        const { message, contentType, fromUser, to } = data;
        await Message.create({
          message,
          contentType,
          users: [fromUser, to],
          sender: fromUser,
        });

        const sendUserSocket = onlineUsers.get(data.to);
        const current = await User.findById(fromUser);
        const anotherUser = await User.findById(to);
        const users = [current, anotherUser];
        console.log(anotherUser);
        console.log(current);
        socket.emit("usersAvatar", users);
        if (sendUserSocket) {
          socket.to(sendUserSocket).emit("msg-recieve", data.message);
        }
      } catch (e) {
        console.log(e);
      }
    });
  console.log("socket is running");
});
