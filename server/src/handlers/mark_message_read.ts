
import { db } from '../db';
import { messagesTable } from '../db/schema';
import { type MarkMessageReadInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const markMessageRead = async (input: MarkMessageReadInput, user_id: number): Promise<void> => {
  try {
    // Update the message to mark it as read
    // Only update if the user is the recipient of the message
    const result = await db.update(messagesTable)
      .set({ 
        is_read: true,
        updated_at: new Date()
      })
      .where(
        and(
          eq(messagesTable.id, input.message_id),
          eq(messagesTable.recipient_id, user_id)
        )
      )
      .returning()
      .execute();

    // If no rows were updated, the message either doesn't exist or doesn't belong to the user
    if (result.length === 0) {
      throw new Error('Message not found or access denied');
    }
  } catch (error) {
    console.error('Mark message read failed:', error);
    throw error;
  }
};
