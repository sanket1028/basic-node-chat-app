const path = require("path");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const port = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = socketio(server); // setting up the socket.io with our server

// let count = 0;

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {
  /*
  socket.emit("message", generateMessage("Welcome!"));
  socket.broadcast.emit(
    "message",
    generateMessage("A new user has joined the chat!")
  );
  emitting a event to call the connected client except the client with new connection
  if a new connection is been made
  */

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room); // method avaliable to sever side code to make the connection join to the specific room
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined the chat!`)
      );
    // emitting the event to all the connection in the room except the new connection
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("Invalid socket Id");
    }
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left the chat!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return;
    }
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
    callback();
  });

  /*
  socket.emit("countUpdated", count);
  console.log("New Web Socket Connection is established");
  socket.on("increment", () => {
    count++;
    // socket.emit("countUpdated", count);
    io.emit("countUpdated", count);
  });
  */
});

server.listen(port, console.log(`Server is running on port ${port}`));
