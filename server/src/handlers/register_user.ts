
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type PublicUser } from '../schema';
import { eq } from 'drizzle-orm';

export const registerUser = async (input: RegisterUserInput): Promise<PublicUser> => {
  try {
    // Check if user with email already exists
    const existingUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password using Bun's built-in password hashing
    const password_hash = await Bun.password.hash(input.password);

    // Insert new user into database
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        password_hash,
        first_name: input.first_name,
        last_name: input.last_name
      })
      .returning()
      .execute();

    const user = result[0];

    // Return public user info (without password hash)
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};
