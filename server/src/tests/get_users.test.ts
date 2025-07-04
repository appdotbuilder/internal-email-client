
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users with public fields only', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        email: 'alice@example.com',
        password_hash: 'hash1',
        first_name: 'Alice',
        last_name: 'Smith'
      },
      {
        email: 'bob@example.com',
        password_hash: 'hash2',
        first_name: 'Bob',
        last_name: 'Johnson'
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].email).toEqual('alice@example.com');
    expect(result[0].first_name).toEqual('Alice');
    expect(result[0].last_name).toEqual('Smith');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Ensure password_hash is not included
    expect('password_hash' in result[0]).toBe(false);
  });

  it('should order users by first name then last name', async () => {
    // Create test users in mixed order
    await db.insert(usersTable).values([
      {
        email: 'charlie@example.com',
        password_hash: 'hash3',
        first_name: 'Charlie',
        last_name: 'Brown'
      },
      {
        email: 'alice@example.com',
        password_hash: 'hash1',
        first_name: 'Alice',
        last_name: 'Smith'
      },
      {
        email: 'bob@example.com',
        password_hash: 'hash2',
        first_name: 'Bob',
        last_name: 'Johnson'
      },
      {
        email: 'anna@example.com',
        password_hash: 'hash4',
        first_name: 'Alice',
        last_name: 'Johnson'
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(4);
    
    // Check ordering: Alice Johnson, Alice Smith, Bob Johnson, Charlie Brown
    expect(result[0].first_name).toEqual('Alice');
    expect(result[0].last_name).toEqual('Johnson');
    
    expect(result[1].first_name).toEqual('Alice');
    expect(result[1].last_name).toEqual('Smith');
    
    expect(result[2].first_name).toEqual('Bob');
    expect(result[2].last_name).toEqual('Johnson');
    
    expect(result[3].first_name).toEqual('Charlie');
    expect(result[3].last_name).toEqual('Brown');
  });

  it('should include all required public fields', async () => {
    // Create a test user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      password_hash: 'testhash',
      first_name: 'Test',
      last_name: 'User'
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Check all required fields exist
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.first_name).toBe('string');
    expect(typeof user.last_name).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(user.email).toEqual('test@example.com');
    expect(user.first_name).toEqual('Test');
    expect(user.last_name).toEqual('User');
  });
});
