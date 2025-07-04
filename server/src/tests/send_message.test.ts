
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type SendMessageInput } from '../schema';
import { sendMessage } from '../handlers/send_message';
import { eq } from 'drizzle-orm';

describe('sendMessage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let senderId: number;
  let recipientId: number;
  const testInput: SendMessageInput = {
    recipient_email: 'recipient@example.com',
    subject: 'Test Subject',
    body: 'This is a test message body'
  };

  beforeEach(async () => {
    // Create sender user
    const senderResult = await db.insert(usersTable)
      .values({
        email: 'sender@example.com',
        password_hash: 'hashedpassword123',
        first_name: 'John',
        last_name: 'Sender'
      })
      .returning()
      .execute();
    senderId = senderResult[0].id;

    // Create recipient user
    const recipientResult = await db.insert(usersTable)
      .values({
        email: 'recipient@example.com',
        password_hash: 'hashedpassword456',
        first_name: 'Jane',
        last_name: 'Recipient'
      })
      .returning()
      .execute();
    recipientId = recipientResult[0].id;
  });

  it('should send a message successfully', async () => {
    const result = await sendMessage(testInput, senderId);

    // Verify message fields
    expect(result.subject).toEqual('Test Subject');
    expect(result.body).toEqual('This is a test message body');
    expect(result.is_read).toBe(false);
    expect(result.sender_id).toEqual(senderId);
    expect(result.recipient_id).toEqual(recipientId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify sender details
    expect(result.sender.id).toEqual(senderId);
    expect(result.sender.email).toEqual('sender@example.com');
    expect(result.sender.first_name).toEqual('John');
    expect(result.sender.last_name).toEqual('Sender');

    // Verify recipient details
    expect(result.recipient.id).toEqual(recipientId);
    expect(result.recipient.email).toEqual('recipient@example.com');
    expect(result.recipient.first_name).toEqual('Jane');
    expect(result.recipient.last_name).toEqual('Recipient');
  });

  it('should save message to database', async () => {
    const result = await sendMessage(testInput, senderId);

    // Query database to verify message was saved
    const messages = await db.select()
      .from(messagesTable)
      .where(eq(messagesTable.id, result.id))
      .execute();

    expect(messages).toHaveLength(1);
    const savedMessage = messages[0];
    expect(savedMessage.subject).toEqual('Test Subject');
    expect(savedMessage.body).toEqual('This is a test message body');
    expect(savedMessage.sender_id).toEqual(senderId);
    expect(savedMessage.recipient_id).toEqual(recipientId);
    expect(savedMessage.is_read).toBe(false);
    expect(savedMessage.created_at).toBeInstanceOf(Date);
    expect(savedMessage.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when recipient does not exist', async () => {
    const invalidInput: SendMessageInput = {
      recipient_email: 'nonexistent@example.com',
      subject: 'Test Subject',
      body: 'Test Body'
    };

    await expect(sendMessage(invalidInput, senderId)).rejects.toThrow(/recipient not found/i);
  });

  it('should handle empty subject and body', async () => {
    const emptyInput: SendMessageInput = {
      recipient_email: 'recipient@example.com',
      subject: '',
      body: ''
    };

    const result = await sendMessage(emptyInput, senderId);

    expect(result.subject).toEqual('');
    expect(result.body).toEqual('');
    expect(result.sender_id).toEqual(senderId);
    expect(result.recipient_id).toEqual(recipientId);
  });

  it('should handle long message content', async () => {
    const longInput: SendMessageInput = {
      recipient_email: 'recipient@example.com',
      subject: 'A'.repeat(1000),
      body: 'B'.repeat(5000)
    };

    const result = await sendMessage(longInput, senderId);

    expect(result.subject).toEqual('A'.repeat(1000));
    expect(result.body).toEqual('B'.repeat(5000));
    expect(result.sender_id).toEqual(senderId);
    expect(result.recipient_id).toEqual(recipientId);
  });
});
