const express = require("express");
const http = require("http");
const app = express();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoutes");
const producsRoutes = require("./routes/Prodcutsroutes");
const { graphqlHTTP } = require("express-graphql");
const schema = require("./schema");
const PORT = 3001;
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

let user = null;
let userID = null;

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
      const { first_name, last_name, email, password, token, products } = input;

      if (!(email && password && first_name && last_name)) {
        return "All input is required";
      }
      // check if user already exist
      const oldUser = await User.findOne({ email });
      if (oldUser) {
        return "User Already Exist. Please Login";
      }
      encryptedPassword = await bcrypt.hash(password, 10);
      // Create user in our database
      const user = await User.create({
        first_name,
        last_name,
        email: email.toLowerCase(), // sanitize: convert email to lowercase
        password: encryptedPassword,
        token,
        products,
      });

      return user;
    } catch (e) {
      console.log(e.message);
    }
  },
  loginUser: async ({ input }) => {
    try {
      const { email, password } = input;
      if (!(email && password)) {
        return "All input is required";
      }
      user = await User.findOne({ email });
      if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
          { user_id: user._id, email },
          process.env.TOKEN_KEY,
          {
            expiresIn: "2h",
          }
        );
        user.token = token;
        userID = user._id;

        console.log(userID, "userId");
        await user.save();
      }
      return user;
    } catch (e) {
      console.log(e.message);
    }
  },
  createProduct: async ({ input }) => {
    const { image, name, mpns, manifactuler, checkbox } = input;
    if (!(image && name && mpns && manifactuler)) {
      return "data product is not valid";
    }
    const data = await Product.create({
      image,
      name,
      mpns,
      manifactuler,
      user: userID,
      checkbox,
      searchId: "",
    });

    return data;
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
