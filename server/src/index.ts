
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { 
  registerUserInputSchema, 
  loginUserInputSchema, 
  sendMessageInputSchema, 
  markMessageReadInputSchema,
  getMessagesInputSchema 
} from './schema';
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { sendMessage } from './handlers/send_message';
import { getMessages } from './handlers/get_messages';
import { markMessageRead } from './handlers/mark_message_read';
import { getUsers } from './handlers/get_users';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Authentication routes
  register: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),
  
  login: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),
  
  // Message routes (require authentication in real implementation)
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input }) => {
      // In real implementation, extract user_id from auth context
      const sender_id = 1; // Placeholder
      return sendMessage(input, sender_id);
    }),
  
  getMessages: publicProcedure
    .input(getMessagesInputSchema)
    .query(({ input }) => {
      // In real implementation, extract user_id from auth context
      const user_id = 1; // Placeholder
      return getMessages(input, user_id);
    }),
  
  markMessageRead: publicProcedure
    .input(markMessageReadInputSchema)
    .mutation(({ input }) => {
      // In real implementation, extract user_id from auth context
      const user_id = 1; // Placeholder
      return markMessageRead(input, user_id);
    }),
  
  // User routes
  getUsers: publicProcedure
    .query(() => getUsers()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
