
import { connection, server as WebSocketServer } from "websocket"
import http from 'http';
import { IncomingMessage, supportedMessage } from "./messages/incomingMessages";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./store/inMemoryStore";
import { SupportedMessage as OutgoingSupportedMessage, OutgoingMessage } from "./messages/outgoingMessages";

const server = http.createServer(function (request: any, response: any) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

const userManager = new UserManager();
const store = new InMemoryStore();

server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});
const wsServer = new WebSocketServer({
    httpServer: server,

    autoAcceptConnections: true
});
function originIsAllowed(origin: string) {

    return true;
}
wsServer.on('request', function (request) {
    console.log("inside connect")
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');

        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
        console.log(message)
        if (message.type === 'utf8') {
            try {
                console.log("indie with message", message.utf8Data)
                messageHandler(connection, JSON.parse(message.utf8Data))

            } catch (e) {

            }

            // console.log('Received Message: ' + message.utf8Data);
            // connection.sendUTF(message.utf8Data);
        }

    });
    connection.on('close', function (reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

function messageHandler(ws: connection, message: IncomingMessage) {
    console.log("incoming message" + JSON.stringify(message))
    if (message.type == supportedMessage.JoinRoom) {
        const payload = message.payload;
        userManager.addUser(payload.name, payload.roomId, payload.userId, ws)
    }
    if (message.type == supportedMessage.SendMessage) {
        const payload = message.payload;
        const user = userManager.getUser(payload.roomId, payload.userId);
        if (!user) {
            console.log("User not found");
            return;
        }
        let chat = store.addChat(payload.userId, payload.roomId, payload.message, user.name);
        if (!chat) {
            console.log("Chat not found")
            return;
        }
        //broadcast logic
        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessage.AddChat,
            payload: {
                chatId: chat.id,
                roomId: payload.roomId,
                message: payload.message,
                name: user.name,
                upvotes: 0
            }

        }
        userManager.broadcast(payload.userId, payload.roomId, outgoingPayload)
    }

    if (message.type == supportedMessage.UpvoteMessage) {
        const payload = message.payload;
        const chat = store.upvote(payload.userId, payload.chatId, payload.roomId);
        if (!chat) {
            return;
        }
        //broadcast logic
        const outgoingPayload: OutgoingMessage = {
            type: OutgoingSupportedMessage.UpdateChat,
            payload: {
                chatId: payload.chatId,
                roomId: payload.roomId,
                upvotes: chat.upvotes.length
            }

        }

        userManager.broadcast(payload.userId, payload.roomId, outgoingPayload)
    }

}