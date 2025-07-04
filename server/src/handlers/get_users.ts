
import { type PublicUser } from '../schema';

export const getUsers = async (): Promise<PublicUser[]> => {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to fetch all users for recipient selection
  // in the compose interface. Returns public user info only.
  // Steps:
  // 1. Query all users from database
  // 2. Return only public fields (exclude password_hash)
  // 3. Order by name for better UX
  return Promise.resolve([]);
};
