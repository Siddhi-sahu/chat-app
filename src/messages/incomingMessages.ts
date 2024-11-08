import { z } from "zod";


export enum supportedMessage {
    JoinRoom = "JOIN_ROOM",
    SendMessage = "SEND_MESSAGE",
    UpvoteMessage = "UPVOTE_MESSAGE"
}

export type IncomingMessage = {
    type: supportedMessage.JoinRoom,
    payload: InitMessageType
} | {
    type: supportedMessage.SendMessage,
    payload: UserMessageType
} | {
    type: supportedMessage.UpvoteMessage,
    payload: UpvoteMessageType

}

export const InitMessage = z.object({
    name: z.string(),
    roomId: z.string(),
    userId: z.string()
});

export type InitMessageType = z.infer<typeof InitMessage>

export const UserMessage = z.object({
    userId: z.string(),
    roomId: z.string(),
    message: z.string()
})
export type UserMessageType = z.infer<typeof UserMessage>

export const UpvoteMessage = z.object({
    userId: z.string(),
    roomId: z.string(),
    chatId: z.string()

})

export type UpvoteMessageType = z.infer<typeof UpvoteMessage>