import { Injectable, Logger } from "@nestjs/common";
import type { ChatCompletionMessageParam } from "openai/resources/index";

/**
 * Message Context Command Handler
 *
 * Handles message context limitation based on model's maxContext setting.
 */
@Injectable()
export class MessageContextCommandHandler {
    private readonly logger = new Logger(MessageContextCommandHandler.name);

    /**
     * Limit messages based on model's maxContext setting
     * Preserves system message if exists and keeps most recent messages
     *
     * @param messages - Original messages array
     * @param maxContext - Maximum context count from model config
     * @returns Limited messages array
     */
    limitMessageContext(
        messages: ChatCompletionMessageParam[],
        maxContext?: number,
    ): ChatCompletionMessageParam[] {
        if (!maxContext || maxContext <= 0 || messages.length <= maxContext) {
            return [...messages];
        }

        let limitedMessages = [...messages];

        // Find system message
        const systemMessageIndex = limitedMessages.findIndex((msg) => msg.role === "system");

        if (systemMessageIndex !== -1) {
            // If system message exists, preserve it
            const systemMessage = limitedMessages[systemMessageIndex];
            // Remove system message from array
            limitedMessages.splice(systemMessageIndex, 1);

            // Take last (maxContext - 1) messages
            const remainingCount = maxContext - 1;
            if (limitedMessages.length > remainingCount) {
                limitedMessages = limitedMessages.slice(-remainingCount);
            }

            // Put system message at the beginning
            limitedMessages.unshift(systemMessage);
        } else {
            // No system message, just take last maxContext messages
            limitedMessages = limitedMessages.slice(-maxContext);
        }

        this.logger.debug(
            `🔄 上下文限制: 原始消息数 ${messages.length}, 限制后消息数 ${limitedMessages.length}, 最大上下文 ${maxContext}`,
        );

        return limitedMessages;
    }
}
