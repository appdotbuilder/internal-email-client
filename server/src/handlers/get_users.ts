
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type PublicUser } from '../schema';
import { asc } from 'drizzle-orm';

export const getUsers = async (): Promise<PublicUser[]> => {
  try {
    // Query all users from database, ordered by name for better UX
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      first_name: usersTable.first_name,
      last_name: usersTable.last_name,
      created_at: usersTable.created_at
    })
    .from(usersTable)
    .orderBy(asc(usersTable.first_name), asc(usersTable.last_name))
    .execute();

    return users;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};
