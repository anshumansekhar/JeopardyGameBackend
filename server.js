/*
    Jeopardy Game Server
    contains logic to 
    1-accept client sockets
    2-allot them to rooms
    3-send question to apt. player
    4-recieve answer and check if correct
    5-update player score
    6-end game when questions are over
    7-connect to database to get questions
    8-prepare and send scoreboard to players
*/

// nodejs module to import
const env = require("dotenv");
// express to create server
const server = require('express')();
// cors to allow cross origin resource sharing
const cors = require('cors')
// http to create http server
const httpModule = require('http');
// socket.io to allow websocket communication
const socketModule = require('socket.io');


// config enviroment
env.config();

// allow express app to use cors
server.use(cors());


// create http server with the express app
const http = httpModule.createServer(server);

// socket connection using the http server
// with cors object that allow request from any origin
const io = socketModule(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


// store all the games
let games = {};


// TODO get question from database

// test questions
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

// when a socket connection request is recievec from a client 
io.on('connection', function (socket) {
    // print the socket id connected
    console.log('A user connected: ' + socket.id);

    // when any player send createGame event with game object
    socket.on('createGame', (game) => {
        // form a player object contaning
        // id,name,and score
        const player = {
            socketId: socket.id,
            playerName: game.playerName,
            playerScore: 0
        }
        // form a game object to push to games array
        // game object contains
        // createdBy,num of players,players array,currentplayerindex
        // roomname as generated using the logic
        // and questions array contaning 5 questions each from respective categories
        // with a question count
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
        // add the new game object created to games array
        games[gameObj.roomName] = gameObj;
        // join the current socket to the room name generated
        socket.join(gameObj.roomName);
        // get all the rooms in the server
        const rooms = io.of("/").adapter.rooms;
        // get the room generated size
        const roomSize = rooms.get(gameObj.roomName).size;
        // calculated players left to join
        const playersLeft = gameObj.numPlayers - roomSize;
        // send the player object as userDetails event to the client who created the game
        io.to(socket.id).emit("userDetails", player);
        // send gameCreated event to every client connected to the room
        // with room name and message
        socket.emit("gameCreated", gameObj.roomName, `Waiting for ${playersLeft} players`);
    });

    // when any player send joinGame event
    // accepts a joinReq object
    socket.on('joinGame', (joinReq) => {
        // get the room name from request

        // TODO check if room exists
        const roomName = joinReq.roomName;
        // form the player object
        const player = {
            socketId: socket.id,
            playerName: joinReq.playerName,
            playerScore: 0
        }
        // push the player object to the list of players
        // in the game room provided
        games[roomName].players.push(player);
        // join the room
        socket.join(roomName);

        // get all rooms present in server
        const rooms = io.of("/").adapter.rooms;
        // get the provided room size
        const roomSize = rooms.get(roomName).size;
        // calculated players left to join
        const playersLeft = games[roomName].numPlayers - roomSize;
        // send playerJoined event to all the players in the room
        io.to(roomName).emit('playerJoined', `waiting for ${playersLeft} players to join`);
        // send userDetails event to the player who joined the room along with the player object
        io.to(socket.id).emit("userDetails", player);

        // when there are no players left to join
        if (playersLeft === 0) {
            // send startGame event to all the players in the room
            io.to(roomName).emit('startGame', "Starting Game!!");
            // get the player whose turn it is
            const playerTurn = games[roomName].players[games[roomName].currentPlayerIndex];
            // send takeTurn event to all the players in the room
            // pass the player object of the player whose turn it is
            io.to(roomName).emit('takeTurn',
                `${playerTurn.playerName} 's turn`,
                playerTurn)
        }
    })

    // when any player selects a category from the game board
    socket.on("categorySelected", req => {
        // prepare response
        // include amount selected,category,selected by and room name
        const res = {
            amount: req.amount,
            category: req.category,
            by: req.by,
            roomName: req.roomName
        }
        // send categorySelectedResponse to all the players in the game room
        io.to(req.roomName).emit('categorySelectedResponse',
            `${res.by} selected ${res.amount} from ${res.category}`,
            res);
        // get question for the apt. amount and category
        const text = games[req.roomName].questions[req.category][(req.amount / 200) - 1].Headline
        // prepare question object to send
        // it include question text,amount and category
        const question = {
            text: text,
            amount: req.amount,
            category: req.category
        }
        // sent question event to the paticular player who selected the category
        io.to(socket.id).emit("Question", question);
    })

    // when any player submits answer
    socket.on("Answer", req => {
        // get the game room 
        const gameRoom = games[req.gameRoom];
        // get the question details for which answer was sent like amount,category
        const questionInReqAmount = req.question.amount;
        const questionInReqCategory = req.question.category;
        // get the question present in the server
        const questionInServer = gameRoom.questions[questionInReqCategory][(questionInReqAmount / 200) - 1]
        // get the current player who was supposed to answer
        const currPlayer = gameRoom.players[gameRoom.currentPlayerIndex];

        // check answer
        // if answer matched
        if (questionInServer.Answer === req.answer) {
            // increase player score by the question amount
            currPlayer.playerScore += questionInReqAmount;
        }
        else {
            // else decrease player score by the question amount
            currPlayer.playerScore -= questionInReqAmount;
        }
        // decrease the number of questions available in the game
        gameRoom.questions.count--;
        // send updateScore event to the player who answered
        io.to(socket.id).emit("UpdateScore", currPlayer);
        // change the current player who will take the turn
        gameRoom.currentPlayerIndex = (gameRoom.currentPlayerIndex + 1) % gameRoom.numPlayers;

        // if there are questions left in the room
        if (gameRoom.questions.count !== 0) {
            // get the player who has to take turn
            const playerTurn = gameRoom.players[gameRoom.currentPlayerIndex];
            // send takeTurn event to all the players present in the room
            io.to(gameRoom.roomName).emit('takeTurn',
                `${playerTurn.playerName} 's turn`,
                playerTurn)
        }
        // if no questions are left
        else {
            // form a scoreboard to display to all the players
            const scoreBoard = [];
            // loop through each individual player in the game room
            gameRoom.players.forEach(player => {
                // push the current player name and score to the scoreboard array
                scoreBoard.push({
                    name: player.playerName,
                    score: player.playerScore
                })
            });
            // send EndGame event to all the players in the game room along with the score board created
            io.to(gameRoom.roomName).emit("EndGame", "Game Ended", scoreBoard);

            // TODO delete the game room
        }

    })

    // whenever a player closes the website 
    socket.on('disconnect', function (reason) {
        console.log('A user disconnected: ' + socket.id);
    });
});
// whenever a room is created print to console
io.of("/").adapter.on("create-room", (room) => {
    console.log(`room ${room} was created`);
});

// whenever a socket joins a room
io.of("/").adapter.on("join-room", (room, id) => {
    console.log(`socket ${id} has joined room ${room}`);
});


// start httpserver to listen on port number 
http.listen(process.env.PORT, function () {
    // print when server starts listening
    console.log(`Server started on port ${process.env.PORT}`);
});