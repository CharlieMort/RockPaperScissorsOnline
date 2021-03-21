const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const PORT = 5000;
const URI = "mongodb+srv://user_1:77fmSnbfHPT8@cluster0.7mfwy.mongodb.net/RPSOnline?retryWrites=true&w=majority";

app.use(express.json());
app.use(cors());

mongoose.connect(URI, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology:true});
const connection = mongoose.connection;

connection.on("open", () => console.log("MongoDB Connected..."));

const usersRouter = require("./routes/user");

app.use("/users", usersRouter);

//On Connection They Join/Create A Room
//The If Space They Join That Room
//If Not They Create A New Room
//When Game Is Done They Leave The Room

let rooms = {};

function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

const server = http.createServer(app);
const index = require("./routes/index");
app.use(index);

const io = socketIO(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

function CreateRoom(roomCode) {
    rooms[roomCode] = {
        player1: "",
        //player1ID: "",
        player2: "",
        //player2ID: "",
        player1Choice: "",
        player2Choice: "",
        winner: "",
    }
}

function JoinRoom(playerSocket, roomCode, playerID) {
    if (rooms[roomCode].player1 === "") {
        rooms[roomCode].player1 = playerSocket;
        //rooms[roomCode].player1ID = playerID;
    }
    else if (rooms[roomCode].player2 === "") {
        rooms[roomCode].player2 = playerSocket;
        //rooms[roomCode].player2ID = playerID;
    } 
    else return "Room Full";
    console.log(rooms);
}

function CheckForWinner(choice1, choice2) {
    if (choice1 === "" || choice2 === "") return null;
    if ((choice1 === "Rock" && choice2 === "Scissors") || choice1 === "Paper" && choice2 === "Rock" || choice1 === "Scissors" && choice2 === "Paper") return "one";
    if (choice1 === choice2) return "draw";
    return "two";
}

function RemoveFromAllRooms(socketID) {
    for (id in rooms) {
        if (rooms[id].player1 == socketID) {
            rooms[id].player1 = "";
            //rooms[id].player1ID = "";
            rooms[id].player1Choice = "";
            console.log(rooms[id]);
        }
        else if (rooms[id].player2 == socketID) {
            rooms[id].player2 = "";
            //rooms[id].player2ID = "";
            rooms[id].player2Choice = "";
            console.log(rooms[id]);
        }
    }
}

io.on("connection", (socket) => {
    console.log(`New Client Connected ${socket.id}`);
    console.log(`Total Clients Connected:${io.engine.clientsCount}`)
    socket.emit("socketInfo", socket.id);

    socket.on("create_room", () => {
        let roomCode = makeid(5);
        console.log(`Room Created:${roomCode}`);
        CreateRoom(roomCode);
        JoinRoom(socket.id, roomCode);
        socket.join(roomCode);
        socket.emit("room_join", roomCode);
    })

    socket.on("join_room", (data, playerID) => {
        JoinRoom(socket.id, data, playerID);
        socket.join(data);
        socket.emit("room_join", data);
    })

    socket.on("choose", (choice, roomIn) => {
        if (socket.id == rooms[roomIn].player1) rooms[roomIn].player1Choice = choice;
        else if (socket.id == rooms[roomIn].player2) rooms[roomIn].player2Choice = choice;
        let winner = CheckForWinner(rooms[roomIn].player1Choice, rooms[roomIn].player2Choice);
        if (winner) {
            if (winner == "one") {
                winner = rooms[roomIn].player1;
            } 
            else if (winner == "two") {
                winner = rooms[roomIn].player2;
            } 
            console.log(winner);
            rooms[roomIn].winner = winner;
            io.in(roomIn).emit("winner", winner);
        }
        console.log(rooms[roomIn]);
    })

    socket.on("restart", (roomID) => {
        rooms[roomID].player1Choice = "";
        rooms[roomID].player2Choice = "";
        rooms[roomID].winner = "";
        io.in(roomID).emit("restartServer");
    });

    socket.on("disconnect", () => {
        console.log(`Client ${socket.id} has disconnected`);
        RemoveFromAllRooms(socket.id);
        console.log(`Total Clients Connected:${io.engine.clientsCount}`);
    })
});

//app.listen(PORT, () => console.log(`Listening On Port ${PORT}`));
server.listen(PORT, () => console.log(`Http Server Listening On ${PORT}`));