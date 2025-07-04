
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type SendMessageInput, type MessageWithUsers } from '../schema';
import { eq } from 'drizzle-orm';

export const sendMessage = async (input: SendMessageInput, sender_id: number): Promise<MessageWithUsers> => {
  try {
    // Find recipient by email
    const recipients = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.recipient_email))
      .execute();

    if (recipients.length === 0) {
      throw new Error('Recipient not found');
    }

    const recipient = recipients[0];

    // Create new message record
    const messageResult = await db.insert(messagesTable)
      .values({
        sender_id: sender_id,
        recipient_id: recipient.id,
        subject: input.subject,
        body: input.body,
        is_read: false
      })
      .returning()
      .execute();

    const message = messageResult[0];

    // Get sender details
    const senders = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, sender_id))
      .execute();

    const sender = senders[0];

    // Return message with sender and recipient details
    return {
      id: message.id,
      sender_id: message.sender_id,
      recipient_id: message.recipient_id,
      subject: message.subject,
      body: message.body,
      is_read: message.is_read,
      created_at: message.created_at,
      updated_at: message.updated_at,
      sender: {
        id: sender.id,
        email: sender.email,
        first_name: sender.first_name,
        last_name: sender.last_name
      },
      recipient: {
        id: recipient.id,
        email: recipient.email,
        first_name: recipient.first_name,
        last_name: recipient.last_name
      }
    };
  } catch (error) {
    console.error('Send message failed:', error);
    throw error;
  }
};
