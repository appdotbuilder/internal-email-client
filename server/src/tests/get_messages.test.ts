
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, messagesTable } from '../db/schema';
import { type GetMessagesInput } from '../schema';
import { getMessages } from '../handlers/get_messages';

describe('getMessages', () => {
  let user1Id: number;
  let user2Id: number;
  let user3Id: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          password_hash: 'hash1',
          first_name: 'John',
          last_name: 'Doe'
        },
        {
          email: 'user2@example.com',
          password_hash: 'hash2',
          first_name: 'Jane',
          last_name: 'Smith'
        },
        {
          email: 'user3@example.com',
          password_hash: 'hash3',
          first_name: 'Bob',
          last_name: 'Johnson'
        }
      ])
      .returning()
      .execute();

    user1Id = users[0].id;
    user2Id = users[1].id;
    user3Id = users[2].id;

    // Create test messages
    await db.insert(messagesTable)
      .values([
        {
          sender_id: user1Id,
          recipient_id: user2Id,
          subject: 'Message 1',
          body: 'Hello from user1 to user2',
          is_read: false
        },
        {
          sender_id: user2Id,
          recipient_id: user1Id,
          subject: 'Message 2',
          body: 'Reply from user2 to user1',
          is_read: true
        },
        {
          sender_id: user3Id,
          recipient_id: user1Id,
          subject: 'Message 3',
          body: 'Hello from user3 to user1',
          is_read: false
        },
        {
          sender_id: user1Id,
          recipient_id: user3Id,
          subject: 'Message 4',
          body: 'Reply from user1 to user3',
          is_read: false
        }
      ])
      .execute();
  });

  afterEach(resetDB);

  it('should get all messages for user (both sent and received)', async () => {
    const input: GetMessagesInput = {};
    const result = await getMessages(input, user1Id);

    expect(result).toHaveLength(4); // user1 involved in 4 messages (2 sent, 2 received)
    
    // Check that all messages involve user1
    result.forEach(message => {
      expect(message.sender_id === user1Id || message.recipient_id === user1Id).toBe(true);
    });

    // Check message structure
    const firstMessage = result[0];
    expect(firstMessage.id).toBeDefined();
    expect(firstMessage.subject).toBeDefined();
    expect(firstMessage.body).toBeDefined();
    expect(typeof firstMessage.is_read).toBe('boolean');
    expect(firstMessage.created_at).toBeInstanceOf(Date);
    expect(firstMessage.updated_at).toBeInstanceOf(Date);
    
    // Check sender and recipient details
    expect(firstMessage.sender.id).toBeDefined();
    expect(firstMessage.sender.email).toBeDefined();
    expect(firstMessage.sender.first_name).toBeDefined();
    expect(firstMessage.sender.last_name).toBeDefined();
    
    expect(firstMessage.recipient.id).toBeDefined();
    expect(firstMessage.recipient.email).toBeDefined();
    expect(firstMessage.recipient.first_name).toBeDefined();
    expect(firstMessage.recipient.last_name).toBeDefined();
  });

  it('should get only inbox messages when type is inbox', async () => {
    const input: GetMessagesInput = { type: 'inbox' };
    const result = await getMessages(input, user1Id);

    expect(result).toHaveLength(2); // user1 received 2 messages
    
    // All messages should be received by user1
    result.forEach(message => {
      expect(message.recipient_id).toBe(user1Id);
    });

    // Check specific message content
    const subjects = result.map(msg => msg.subject);
    expect(subjects).toContain('Message 2');
    expect(subjects).toContain('Message 3');
  });

  it('should get only sent messages when type is sent', async () => {
    const input: GetMessagesInput = { type: 'sent' };
    const result = await getMessages(input, user1Id);

    expect(result).toHaveLength(2); // user1 sent 2 messages
    
    // All messages should be sent by user1
    result.forEach(message => {
      expect(message.sender_id).toBe(user1Id);
    });

    // Check specific message content
    const subjects = result.map(msg => msg.subject);
    expect(subjects).toContain('Message 1');
    expect(subjects).toContain('Message 4');
  });

  it('should apply pagination correctly', async () => {
    const input: GetMessagesInput = { limit: 2, offset: 0 };
    const result = await getMessages(input, user1Id);

    expect(result).toHaveLength(2);

    // Test offset
    const inputWithOffset: GetMessagesInput = { limit: 2, offset: 2 };
    const resultWithOffset = await getMessages(inputWithOffset, user1Id);

    expect(resultWithOffset).toHaveLength(2); // 2 messages left after offset (4 total - 2 offset = 2)
    
    // Ensure different messages are returned
    const firstIds = result.map(msg => msg.id);
    const offsetIds = resultWithOffset.map(msg => msg.id);
    expect(firstIds).not.toEqual(offsetIds);
  });

  it('should return messages ordered by created_at desc', async () => {
    const input: GetMessagesInput = {};
    const result = await getMessages(input, user1Id);

    // Check that messages are ordered by created_at in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });

  it('should return empty array when user has no messages', async () => {
    // Create a new user with no messages
    const newUser = await db.insert(usersTable)
      .values({
        email: 'newuser@example.com',
        password_hash: 'hash',
        first_name: 'New',
        last_name: 'User'
      })
      .returning()
      .execute();

    const input: GetMessagesInput = {};
    const result = await getMessages(input, newUser[0].id);

    expect(result).toHaveLength(0);
  });

  it('should handle inbox filter with user who received messages', async () => {
    const input: GetMessagesInput = { type: 'inbox' };
    const result = await getMessages(input, user3Id);

    expect(result).toHaveLength(1); // user3 received 1 message
    expect(result[0].recipient_id).toBe(user3Id);
    expect(result[0].subject).toBe('Message 4');
  });

  it('should include correct user details in messages', async () => {
    const input: GetMessagesInput = { type: 'sent' };
    const result = await getMessages(input, user1Id);

    const message = result.find(msg => msg.subject === 'Message 1');
    expect(message).toBeDefined();
    expect(message!.sender.email).toBe('user1@example.com');
    expect(message!.sender.first_name).toBe('John');
    expect(message!.sender.last_name).toBe('Doe');
    expect(message!.recipient.email).toBe('user2@example.com');
    expect(message!.recipient.first_name).toBe('Jane');
    expect(message!.recipient.last_name).toBe('Smith');
  });
});
