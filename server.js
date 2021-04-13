const env = require("dotenv");
const server = require('express')();
const cors = require('cors')
const httpModule = require('http');
const socketModule = require('socket.io');



env.config();


server.use(cors());


const http = httpModule.createServer(server);
// socket connection using the http server
const io = socketModule(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// store all the players connected
let playersArr = [];
let games = {};

let BusinessQuestions = [
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    }
]
let EditorialQuestions = [
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    }
]
let SportsQuestions = [
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    }
]
let FilmsQuestions = [
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    },
    {
        Headline: "Test Buiness Headline",
        Answer: "Test"
    }
]

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    socket.on('createGame', (game) => {
        const player = {
            socketId: socket.id,
            playerName: game.playerName,
            playerScore: 0
        }
        const gameObj = {
            gameCreatedBy: game.playerName,
            numPlayers: game.numPlayers,
            players: [player],
            currentPlayerIndex: 0,
            roomName: '_' + Math.random().toString(36).substr(2, 9),
            questions: {
                Business: BusinessQuestions,
                Sports: SportsQuestions,
                Editorial: EditorialQuestions,
                Films: FilmsQuestions,
                count: 1
            }
        }
        games[gameObj.roomName] = gameObj;
        socket.join(gameObj.roomName);
        const rooms = io.of("/").adapter.rooms;
        const roomSize = rooms.get(gameObj.roomName).size;
        const playersLeft = gameObj.numPlayers - roomSize;
        io.to(socket.id).emit("userDetails", player);
        socket.emit("gameCreated", gameObj.roomName, `Waiting for ${playersLeft} players`);
    });

    socket.on('joinGame', (joinReq) => {
        const roomName = joinReq.roomName;
        const player = {
            socketId: socket.id,
            playerName: joinReq.playerName,
            playerScore: 0
        }
        games[roomName].players.push(player);
        socket.join(roomName);
        const rooms = io.of("/").adapter.rooms;
        const roomSize = rooms.get(roomName).size;
        const playersLeft = games[roomName].numPlayers - roomSize;
        io.to(roomName).emit('playerJoined', `waiting for ${playersLeft} players to join`);
        io.to(socket.id).emit("userDetails", player);
        if (playersLeft === 0) {
            io.to(roomName).emit('startGame', "Starting Game!!");
            const playerTurn = games[roomName].players[games[roomName].currentPlayerIndex];
            io.to(roomName).emit('takeTurn',
                `${playerTurn.playerName} 's turn`,
                playerTurn)
        }
    })
    socket.on("categorySelected", req => {
        const res = {
            amount: req.amount,
            category: req.category,
            by: req.by,
            roomName: req.roomName
        }
        io.to(req.roomName).emit('categorySelectedResponse',
            `${res.by} selected ${res.amount} from ${res.category}`,
            res);
        const text = games[req.roomName].questions[req.category][(req.amount / 200) - 1].Headline
        const question = {
            text: text,
            amount: req.amount,
            category: req.category
        }
        console.log(question);
        io.to(socket.id).emit("Question", question);
    })

    socket.on("Answer", req => {
        const gameRoom = games[req.gameRoom];
        const questionInReqAmount = req.question.amount;
        const questionInReqCategory = req.question.category;
        const questionInServer = gameRoom.questions[questionInReqCategory][(questionInReqAmount / 200) - 1]
        // check answer
        const currPlayer = gameRoom.players[gameRoom.currentPlayerIndex];
        console.log(questionInServer);
        if (questionInServer.Answer === req.answer) {
            currPlayer.playerScore += questionInReqAmount;
        }
        else {
            currPlayer.playerScore -= questionInReqAmount;
        }
        gameRoom.questions.count--;
        io.to(socket.id).emit("UpdateScore", currPlayer);
        gameRoom.currentPlayerIndex = (gameRoom.currentPlayerIndex + 1) % gameRoom.numPlayers;

        if (gameRoom.questions.count !== 0) {
            const playerTurn = gameRoom.players[gameRoom.currentPlayerIndex];
            io.to(gameRoom.roomName).emit('takeTurn',
                `${playerTurn.playerName} 's turn`,
                playerTurn)
        }
        else{
            const scoreBoard=[];
            gameRoom.players.forEach(player => {
                scoreBoard.push({
                    name:player.playerName,
                    score:player.playerScore
                })
            });
            io.to(gameRoom.roomName).emit("EndGame","Game Ended",scoreBoard);
        }

    })

    socket.on('disconnect', function (reason) {
        console.log('A user disconnected: ' + socket.id);
        playersArr = playersArr.filter(player => player !== socket.id);
    });
});
io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
});

io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
});


// listen on port number 
http.listen(process.env.PORT, function () {
    console.log(`Server started on port ${process.env.PORT}`);
});