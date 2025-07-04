
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user', async () => {
    const result = await registerUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result).not.toHaveProperty('password_hash');
  });

  it('should save user to database with hashed password', async () => {
    const result = await registerUser(testInput);

    // Query the database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual('test@example.com');
    expect(user.first_name).toEqual('John');
    expect(user.last_name).toEqual('Doe');
    expect(user.password_hash).toBeDefined();
    expect(user.password_hash).not.toEqual('password123'); // Should be hashed
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should hash the password correctly', async () => {
    const result = await registerUser(testInput);

    // Get the saved user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    const user = users[0];
    
    // Verify password can be verified with Bun's password verification
    const isValid = await Bun.password.verify('password123', user.password_hash);
    expect(isValid).toBe(true);
    
    // Verify wrong password fails
    const isInvalid = await Bun.password.verify('wrongpassword', user.password_hash);
    expect(isInvalid).toBe(false);
  });

  it('should throw error if user with email already exists', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register second user with same email
    const duplicateInput: RegisterUserInput = {
      email: 'test@example.com',
      password: 'differentpassword',
      first_name: 'Jane',
      last_name: 'Smith'
    };

    await expect(registerUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different user data correctly', async () => {
    const differentInput: RegisterUserInput = {
      email: 'jane@example.com',
      password: 'securepass456',
      first_name: 'Jane',
      last_name: 'Smith'
    };

    const result = await registerUser(differentInput);

    expect(result.email).toEqual('jane@example.com');
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
