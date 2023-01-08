import { BadRequestException, Injectable } from "@nestjs/common";
import { Message, User } from "@prisma/client";
import { ConversationsService } from "src/conversations/conversations.service";
import { PrismaService } from "src/prisma/prisma.service";
import { userSelectedFields } from "src/utils/constants/userSelectedFields";

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsService: ConversationsService,
  ) {}

  async createMessage(user: User, content: string, id: string) {
    const conversation = await this.conversationsService.findById(id);

    if (!conversation) throw new BadRequestException("Conversation not found");

    const { creatorId, recipientId } = conversation;

    if (user.id !== creatorId && user.id !== recipientId)
      throw new BadRequestException("Can't send message");

    const message = await this.prisma.message.create({
      data: {
        content,
        conversationId: conversation.id,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            ...userSelectedFields,
          },
        },
      },
    });

    const updatedConversation = await this.conversationsService.update(
      conversation.id,
      message,
    );

    return {
      message,
      conversation: updatedConversation,
    };
  }

  getMessages(id: string) {
    return this.prisma.message.findMany({
      where: {
        conversationId: id,
      },
      include: {
        author: {
          select: {
            ...userSelectedFields,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async deleteMessage(
    conversationId: string,
    userId: string,
    messageId: string,
  ) {
    const conversation = await this.conversationsService.findById(
      conversationId,
    );
    if (!conversation) throw new BadRequestException("Conversation not found");

    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        authorId: userId,
        conversationId,
      },
    });

    if (!message) throw new BadRequestException("Message not found");

    if (messageId !== conversation.messageId) {
      return this.prisma.message.delete({
        where: {
          id: messageId,
        },
      });
    } else {
      const messages = await this.prisma.message.findMany({
        where: {
          conversationId: conversationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });
      return this.deleteLastMessage(conversationId, messages, message);
    }
  }

  async deleteLastMessage(
    conversationId: string,
    messages: Array<Message>,
    message: Message,
  ) {
    const size = messages.length;
    const SECOND_MESSAGE_INDEX = 1;
    if (size <= 1) {
      await this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          messageId: null,
        },
      });
      return this.prisma.message.delete({
        where: {
          id: message.id,
        },
      });
    } else {
      const newLastMessage = messages[SECOND_MESSAGE_INDEX];
      await this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          messageId: newLastMessage.id,
        },
      });
      return this.prisma.message.delete({
        where: {
          id: message.id,
        },
      });
    }
  }

  async editMessage(content: string, userId: string, messageId: string) {
    const message = await this.prisma.message.findFirst({
      where: {
        id: messageId,
        authorId: userId,
      },
    });
    if (!message) throw new BadRequestException("Can't edit message");
    return this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content,
      },
    });
  }
}
