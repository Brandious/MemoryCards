# Memory Game Server Explained

## Working Stack

    NestJS, Socket.io

    ./server/src/Main.ts >
        Entry point that holds bootstrap function which does initial load ->
                        Instantiate Express Server
                        Enable Cors On It
                        Some configs for express application
                        End Listens on port 3000

    ./server/src/app.service.ts >
     <!-- TODO -->

    ./server/src/app.module.ts >
        Module configuration which setups .env imports and other library modules that we'll comunicate with it, 
        controllers joining and providers which currently we use none

    ./server/src/app.controller.spec.ts
        Routing Controller which setups routes for app, since we're going socket.io way we dont really have any 
        need for it...

## WEBSOCKET CONFIGURATION

    As mentioned above this app uses Nestjs as express server framework which in return gives us object oriented 
    mvc architecture based on Express NodeJS server.

    With this approach we have out of a box solutions for websockets and sockets.io platforms without much 
    grinding. Let's take a look at websockets folder that gives us realtime websocket support for our app.


    ./server/src/game-io.adapter.ts >

        This folder gives as class that follows adapter pattern for wrapping other classes to support real time 
        changes and client server comunication.

        It follows a structure of private attribute options which setups some websocket configs like usable path, 
        cors, transports, socket listeners etc.

        Constructor which instantiates this adapter that recieves port number and options server and creates 
        websocket server in return.

        bindClientConnect method recieves server and callback and awaits on given event, what it really does it 
        callbacks on socket while setting up maxListeners which are created as private attribute of this adapter 
        class;

    ./server/src/ws.validation-pipe.ts >

        This class is used for validating websocket objects! What it does is it extends ValidationPipe from NestJS/
        common and gives us ExceptionFactory method which injects validation errors and returns server exceptions 
        based on an websocket state.

## GAME folder and GameRules Programing

Heavy Lifting folder, this is where our magic happens!

Let's show some more utility classes which help us greatly in developing this application

    ./server/src/game/server.exception.ts >
        ServerException class which makes our life easier by Generating serverExceptionResponse based on 
        WSException from NestJS/websocket.

     ./server/src/game/constant.ts >

        Creates CONSTS for our use in application, this is pretty much self explanitory here...

For now we should get into game logic and see what is happening there starting whit types.ts

      ./server/src/game/game/types.ts >

        Gives us AuthenticatedSocket Type which extends Socket object with data fields where data field can 
        hold Lobby Or Null
        Also extends whith function emit which takes in serverEvent and generic type data and return true or false 
        based on success of emit function

      ./server/src/game/game/dto.ts >

        Gives us validation classes which do validation on given fields for neccessary class. This is pretty much 
        self explanitory.

      ./server/src/game/game/game.module.ts >

        Module type of files are used to connect different part of application which in our case it's used give 
        gameModule providers GameGateway and LobbyManager so that server could communicate between classes.

      ./server/src/game/game/game.gateway.ts >

        Fun part, Game Gateway class which implements OnGatewayConnection, it's firstly annotated with 
        WSValidationPipe and WebSocketGateway.
        It has private attribute called Logger which is instantiated with Gateway.name

        Constructor which recieves lobbyManager

        afterInit method that takes in a server
        gives server instance to lobbyManager server attribute and logs that game is started

        handleConnection that takes in a client which is of type Socket and uses instance of lobbyManager to 
        initializeSocket as authenticated socket... What it does here is creates a new socket with client in it so 
        the responses could be sent there

        handleDisconnect self explanitory takes in a client and removes him from lobby that is terminates socket

        simple SubscribeMessage annotation which reads onPing creates an event that could be emited on Recieving 
        Pong.

        onLobbyCreate generates new lobby and pushes first client in it it returns object that shows that lobby is 
        created based on event and data fields.


        onLobyJoin takes in client and its data which is validated by LobbyJoinDto
        and simply joins a client to lobby.

        onLobbyLeave makes client leave a current lobby

        onRevealCard uses our current lobby to reveals a card that is created on instance attribute.

    Let's go get some logic from lobby folder which gives us single player options and also multiplayer options for 
    two player.

      ./server/src/game/lobby/types.ts >

        Gives us simple LobbyMode type which can be duo or solo mode.

     ./server/src/game/lobby/lobby.ts >

        Let's create Lobby which has 4 public fields that are id, createdAt, clients and instance! Let's stop for a 
        moment.

        id and createdAt are pretty self explanitory fields which are of type uuid and date.

        clients gives as map of clients and their socket id for which are we going to build up a connection

        instance is of type Instance which will be explained later but what Instance does it recieves Lobby object 
        on instantiaton.

        Constructor takes in server and MaxClients

        addClient takes in client which is authenticatedSocket and pushes him into clients map after which it joins 
        on lobbyID
        and binds data.lobby of client that is authenticated socket to this lobby.
        After this method our client's lobby field won't be null and will have lobby object instantiaded after 
        which it checks for max players in game and triggers start, Last move in this method is 
        dispatchingLobbyState.

        RemoveClient is pretty self explanitory
        with a twist of finishing current lobby instance and dispatches message explanation

        dispatchLobbyState creates a payload object based on serverEvent LobbyState that payloads currrent state to 
        server using dispatchToLobby

        dispatchToLobby function takes in generic T payload type and event which send event and payload to server 
        with current id on lobby.

     ./server/src/game/lobby/lobby.manager.ts >

        LobbyManager class dispatches LobbyClass accross web server and web socket which in return generate 
        neccesary functions to handle, manage and cleanup sockets.

        atribute Server of type Server and lobbies attribute which holds all current running lobbies inside of map 
        object described by lobbyID and lobbyObject

        method initializeSocket set socket on client.data.lobby to null

        terminateSocket removes client from lobby

        create lobby generates a new lobby instance based on mode and delay between rounds

        joinLobby takes in lobbyId and client and joins client inside of lobby based on lobbyID

        lobbyCleaner is a CronJob that clears abondoned lobbies


    Instance folder manages underlying instance types like card-state and instance object which are connecting all 
    the underlying logic for a card game of type memory to be handled correctly

      ./server/src/game/insance/card-state.ts >

        CardState gives us constructor method that works on Cards shared object and toDefinitionMethod which 
        translates card to NestJS Readable Card

    ./server/src/game/instance/instance.ts

        as it needs attributes like hasStarted, hasFinished, isSuspended, currentRound, cards, scores, 
        delayBetweenRounds, cardsRevealedForCurrentRound which are prettymuch self explanitory and help us achieve 
        our underlaying logic.

        It shows us triggerStart() which setsup neccessary fields and trigers start message to server so client 
        could consume it.


        triggerFinish() pretty explanitroy function which also trigers finished message so client could consume.

        RevealCard logic here contains our game logic.

            What it does it checks for game status which needs to be active, set revealedCards to 0 then for maps 
            trough cardRevealed and increments revealed cards number if it finds that client already revealed a \
            card.

            It check if two cards are revealed otherwise it returns.

            Otherwise does some other magic based on array which sets a card as revealed
            attaches cardsrevealforcurrentRound to cardState.ownerID and emits server messsage which says card 
            Revealed

            Checks if everyone played if true transition to nextRound and dispatchLobbyState

        transitionToNextRound function suspends current game, and based on timeout given by delay checks if cards 
        are the same and does some incrementing round number and score magic also locks cards

        initializeCards presents a private method that creates array of cards for clients and randomizes them.



