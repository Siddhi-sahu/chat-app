
import { connection, server as WebSocketServer } from "websocket"
import http from 'http';
import { IncomingMessage, supportedMessage } from "./messages/incomingMessages";
import { UserManager } from "./UserManager";
import { InMemoryStore } from "./store/inMemoryStore";
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

    autoAcceptConnections: false
});
function originIsAllowed(origin: string) {

    return true;
}
wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');

        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function (message) {
        if (message.type === 'utf8') {
            try {
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
        store.addChat(payload.userId, payload.roomId, payload.message, user.name)
    }

    if (message.type == supportedMessage.UpvoteMessage) {
        const payload = message.payload;
        store.upvote(payload.userId, payload.chatId, payload.roomId)
    }

}