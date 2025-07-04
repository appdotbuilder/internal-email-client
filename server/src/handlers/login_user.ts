
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput, type AuthSession } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginUserInput): Promise<AuthSession> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password against stored hash
    const passwordValid = await Bun.password.verify(input.password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate session token (simple JWT-like token for demo)
    const sessionPayload = {
      user_id: user.id,
      email: user.email,
      issued_at: Date.now()
    };
    const sessionToken = btoa(JSON.stringify(sessionPayload));

    // Return auth session
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at
      },
      session_token: sessionToken
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};
