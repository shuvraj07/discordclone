/* eslint-disable prettier/prettier */
import { Module } from "@nestjs/common";
import { ConversationsModule } from "../conversations/conversations.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
  imports: [ConversationsModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
