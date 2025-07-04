
import { db } from '../db';
import { messagesTable, usersTable } from '../db/schema';
import { type GetMessagesInput, type MessageWithUsers } from '../schema';
import { eq, or, desc, inArray } from 'drizzle-orm';

export const getMessages = async (input: GetMessagesInput, user_id: number): Promise<MessageWithUsers[]> => {
  try {
    // Start with base query
    const baseQuery = db.select().from(messagesTable);

    // Apply filters based on type
    let query;
    if (input.type === 'inbox') {
      query = baseQuery.where(eq(messagesTable.recipient_id, user_id));
    } else if (input.type === 'sent') {
      query = baseQuery.where(eq(messagesTable.sender_id, user_id));
    } else {
      // No type specified - get both inbox and sent messages
      query = baseQuery.where(or(
        eq(messagesTable.recipient_id, user_id),
        eq(messagesTable.sender_id, user_id)
      ));
    }

    // Apply ordering and pagination
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;
    
    const messages = await query
      .orderBy(desc(messagesTable.created_at))
      .limit(limit)
      .offset(offset)
      .execute();

    // If no messages found, return empty array
    if (messages.length === 0) {
      return [];
    }

    // Get unique user IDs from messages
    const userIds = new Set<number>();
    messages.forEach(message => {
      userIds.add(message.sender_id);
      userIds.add(message.recipient_id);
    });

    // Get user details for all senders and recipients
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      first_name: usersTable.first_name,
      last_name: usersTable.last_name
    })
    .from(usersTable)
    .where(inArray(usersTable.id, Array.from(userIds)))
    .execute();

    // Create user lookup map
    const userMap = new Map(users.map(user => [user.id, user]));

    // Combine messages with user data
    const result: MessageWithUsers[] = messages.map(message => {
      const sender = userMap.get(message.sender_id);
      const recipient = userMap.get(message.recipient_id);

      if (!sender || !recipient) {
        throw new Error(`User data not found for message ${message.id}`);
      }

      return {
        id: message.id,
        sender_id: message.sender_id,
        recipient_id: message.recipient_id,
        subject: message.subject,
        body: message.body,
        is_read: message.is_read,
        created_at: message.created_at,
        updated_at: message.updated_at,
        sender,
        recipient
      };
    });

    return result;
  } catch (error) {
    console.error('Get messages failed:', error);
    throw error;
  }
};
