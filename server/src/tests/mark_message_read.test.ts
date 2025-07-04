
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type MarkMessageReadInput } from '../schema';
import { markMessageRead } from '../handlers/mark_message_read';
import { eq } from 'drizzle-orm';

// Test users
const testSender = {
  email: 'sender@example.com',
  password_hash: 'hashedpassword123',
  first_name: 'John',
  last_name: 'Sender'
};

const testRecipient = {
  email: 'recipient@example.com',
  password_hash: 'hashedpassword456',
  first_name: 'Jane',
  last_name: 'Recipient'
};

// Test message
const testMessage = {
  subject: 'Test Message',
  body: 'This is a test message body',
  is_read: false
};

describe('markMessageRead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark a message as read', async () => {
    // Create test users
    const [sender] = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const [recipient] = await db.insert(usersTable)
      .values(testRecipient)
      .returning()
      .execute();

    // Create test message
    const [message] = await db.insert(messagesTable)
      .values({
        ...testMessage,
        sender_id: sender.id,
        recipient_id: recipient.id
      })
      .returning()
      .execute();

    // Verify message is initially unread
    expect(message.is_read).toBe(false);

    // Test input
    const input: MarkMessageReadInput = {
      message_id: message.id
    };

    // Mark message as read
    await markMessageRead(input, recipient.id);

    // Verify message is now marked as read
    const updatedMessage = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, message.id))
      .execute();

    expect(updatedMessage).toHaveLength(1);
    expect(updatedMessage[0].is_read).toBe(true);
    expect(updatedMessage[0].updated_at).toBeInstanceOf(Date);
    expect(updatedMessage[0].updated_at > message.updated_at).toBe(true);
  });

  it('should only allow recipient to mark message as read', async () => {
    // Create test users
    const [sender] = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const [recipient] = await db.insert(usersTable)
      .values(testRecipient)
      .returning()
      .execute();

    // Create test message
    const [message] = await db.insert(messagesTable)
      .values({
        ...testMessage,
        sender_id: sender.id,
        recipient_id: recipient.id
      })
      .returning()
      .execute();

    const input: MarkMessageReadInput = {
      message_id: message.id
    };

    // Try to mark message as read by sender (should fail)
    await expect(markMessageRead(input, sender.id)).rejects.toThrow(/message not found or access denied/i);

    // Verify message is still unread
    const unchangedMessage = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, message.id))
      .execute();

    expect(unchangedMessage[0].is_read).toBe(false);
  });

  it('should throw error for non-existent message', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values(testRecipient)
      .returning()
      .execute();

    const input: MarkMessageReadInput = {
      message_id: 999999 // Non-existent message ID
    };

    await expect(markMessageRead(input, user.id)).rejects.toThrow(/message not found or access denied/i);
  });

  it('should handle already read message', async () => {
    // Create test users
    const [sender] = await db.insert(usersTable)
      .values(testSender)
      .returning()
      .execute();

    const [recipient] = await db.insert(usersTable)
      .values(testRecipient)
      .returning()
      .execute();

    // Create test message that's already read
    const [message] = await db.insert(messagesTable)
      .values({
        ...testMessage,
        sender_id: sender.id,
        recipient_id: recipient.id,
        is_read: true
      })
      .returning()
      .execute();

    const input: MarkMessageReadInput = {
      message_id: message.id
    };

    // Mark already read message as read (should not throw)
    await markMessageRead(input, recipient.id);

    // Verify message is still read
    const updatedMessage = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, message.id))
      .execute();

    expect(updatedMessage[0].is_read).toBe(true);
  });
});
