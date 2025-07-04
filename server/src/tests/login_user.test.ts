
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
};

const loginInput: LoginUserInput = {
  email: testUser.email,
  password: testUser.password
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate user with valid credentials', async () => {
    // Create test user first
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash,
        first_name: testUser.first_name,
        last_name: testUser.last_name
      })
      .execute();

    const result = await loginUser(loginInput);

    // Verify auth session structure
    expect(result.user.email).toEqual(testUser.email);
    expect(result.user.first_name).toEqual(testUser.first_name);
    expect(result.user.last_name).toEqual(testUser.last_name);
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.session_token).toBeDefined();
    expect(typeof result.session_token).toBe('string');
  });

  it('should generate valid session token', async () => {
    // Create test user first
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash,
        first_name: testUser.first_name,
        last_name: testUser.last_name
      })
      .execute();

    const result = await loginUser(loginInput);

    // Verify session token can be decoded
    const decodedPayload = JSON.parse(atob(result.session_token));
    expect(decodedPayload.user_id).toEqual(result.user.id);
    expect(decodedPayload.email).toEqual(testUser.email);
    expect(decodedPayload.issued_at).toBeDefined();
    expect(typeof decodedPayload.issued_at).toBe('number');
  });

  it('should throw error for non-existent user', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });

  it('should throw error for incorrect password', async () => {
    // Create test user first
    const passwordHash = await Bun.password.hash(testUser.password);
    await db.insert(usersTable)
      .values({
        email: testUser.email,
        password_hash: passwordHash,
        first_name: testUser.first_name,
        last_name: testUser.last_name
      })
      .execute();

    const invalidInput: LoginUserInput = {
      email: testUser.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid credentials/i);
  });
});
