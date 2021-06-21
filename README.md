# JeopardyGameBackend

Backend for Online Game of Jeopardy developed using nodejs.

The server uses socket connection to establish connection with clients i.e players.
Used Socket.io nodejs library for socket connection.

socket.io uses event-driven communication i.e server sends/processes on recieveing a paticular event from any of the clients connected.
When a player starts a room, the server creates a room, connects to the database cotaining headlines and questions and takes 20 questions from the database randomly
5 from each category and sets up a game room  with the required num of players.

The database is remotely hosted mysql database and is connected using mysql nodejs library.

This file contains logic for :-
* accept client sockets
* allot them to rooms
* send question to apt. player
* recieve answer and check if correct
* update player score
* end game when questions are over
* connect to database to get questions
* prepare and send scoreboard to players

## Events 

### connection

A socket connection event is fired by a client.
It is fired whenever any client opens the website.

### createGame
A game created game event is fired, when a player creates a new game sending the number of players and his/her name as parameters.
This create a new game room gets the question from database by running a query .This sends the room name created back to the client who fired the event.

### joinGame

Join game event when a player joins a game with a given room name and his/her player details
When players left to join the game is 0 then a startGame event is sent to every client connected to the game room

each players is sent a takeTurn event in a round robin format

### categorySelected

When a player chooses a category and amount from the board
a question is selected from the questions list and sent to the player who selected the category as question event

### answer

Answer event when a player enters an answer 
the server checks if it is correct , then updates the score of the players , decreases the questions count and sends updateScore event to all the players connected
to the game room.
After sending update score , it checks whose turn it is then send the takeTurn event to the player concerned.

If no questions are left to display then "EndGame" event is sent to all players in the game room with score board as the parameter.



##Database

database is hosted in a remote server is connected using node js .
the database contains 4 tables namely Business, Editorial, sports and trailer then contains Business headlines , Editorials from newspapers , sports news and newly
launched movie trailers respectively.

For generating answers Business and Editorial database have keywords that are the answers.
for sports answer is the game_type and for trailer any one among  movie genre, director name and language is the answer.

### Database table's structure
![Alt](/editorial.png)
![Alt](/business.png)
![Alt](/sports.png)
![Alt](/trailer.png)

