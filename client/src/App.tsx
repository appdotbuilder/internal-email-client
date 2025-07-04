
import { useState, useCallback } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { MessageList } from '@/components/MessageList';
import { ComposeMessage } from '@/components/ComposeMessage';
import type { AuthSession, MessageWithUsers } from '../../server/src/schema';

type View = 'inbox' | 'compose';

function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentView, setCurrentView] = useState<View>('inbox');

  const handleAuth = useCallback((authSession: AuthSession) => {
    setSession(authSession);
    setCurrentView('inbox');
  }, []);

  const handleComposeClick = useCallback(() => {
    setCurrentView('compose');
  }, []);

  const handleMessageSent = useCallback((message: MessageWithUsers) => {
    console.log('Message sent:', message);
    setCurrentView('inbox');
  }, []);

  const handleComposeCancelled = useCallback(() => {
    setCurrentView('inbox');
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
    setCurrentView('inbox');
  }, []);

  if (!session) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'inbox' && (
        <MessageList 
          session={session} 
          onComposeClick={handleComposeClick}
        />
      )}
      
      {currentView === 'compose' && (
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">📧 Internal Email</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.first_name} {session.user.last_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
          
          <ComposeMessage 
            onMessageSent={handleMessageSent}
            onCancel={handleComposeCancelled}
          />
        </div>
      )}
    </div>
  );
}

export default App;
