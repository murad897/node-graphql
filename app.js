const express = require("express");
const http = require("http");
const app = express();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const producsRoutes = require("./routes/Prodcutsroutes");
const { graphqlHTTP } = require("express-graphql");
const schema = require("./schema");
const PORT = 3007;
const Message = require("./models/messageModel");
const cors = require("cors");
const socket = require("socket.io");
const mongoose = require("mongoose");
const Product = require("./models/product");
const User = require("./models/user");
const auth = require("./middleware/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const userRegistrate = () => {};

const root = {
  getUser: async ({ token }) => {
    try {
      const user = await User.findOne({ token });
      return user;
    } catch (e) {
      console.log(e.message);
    }
  },
  getAllUsers: async () => {
    try {
      const users = await User.find({});
      return users;
    } catch (e) {
      console.log(e.message);
    }
  },
  userRegistrate: async ({ input }) => {
    try {
      const { first_name, last_name, email, password, token } = input;
      
      if (!(email && password && first_name && last_name)) {
        return "All input is required";
      }
      // check if user already exist
      const oldUser = await User.findOne({ email });
      if (oldUser) {
        return "User Already Exist. Please Login"
      }
      encryptedPassword = await bcrypt.hash(password, 10);
      // Create user in our database
      const user = await User.create({
        first_name,
        last_name,
        email: email.toLowerCase(), // sanitize: convert email to lowercase
        password: encryptedPassword,
        token,
      });

      console.log(user);
      return user;
    } catch (e) {
      console.log(e.message);
    }
  },
};

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

app.use(
  "/graphql",
  graphqlHTTP({
    graphiql: true,
    schema,
    rootValue: root,
  })
);

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
