
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { MessageWithUsers, GetMessagesInput, AuthSession } from '../../../server/src/schema';

interface MessageListProps {
  session: AuthSession;
  onComposeClick: () => void;
}

export function MessageList({ session, onComposeClick }: MessageListProps) {
  const [inboxMessages, setInboxMessages] = useState<MessageWithUsers[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageWithUsers[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithUsers | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMessages = useCallback(async (type: 'inbox' | 'sent') => {
    setIsLoading(true);
    try {
      const input: GetMessagesInput = { type, limit: 50 };
      const messages = await trpc.getMessages.query(input);
      
      if (type === 'inbox') {
        setInboxMessages(messages);
      } else {
        setSentMessages(messages);
      }
    } catch (err) {
      console.error(`Failed to load ${type} messages:`, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages('inbox');
    loadMessages('sent');
  }, [loadMessages]);

  const handleMessageClick = async (message: MessageWithUsers) => {
    setSelectedMessage(message);
    
    // Mark as read if it's an inbox message and not already read
    if (!message.is_read && message.recipient_id === session.user.id) {
      try {
        await trpc.markMessageRead.mutate({ message_id: message.id });
        // Update local state
        setInboxMessages((prev: MessageWithUsers[]) =>
          prev.map((msg: MessageWithUsers) =>
            msg.id === message.id ? { ...msg, is_read: true } : msg
          )
        );
      } catch (err) {
        console.error('Failed to mark message as read:', err);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageItem = ({ message, isInbox }: { message: MessageWithUsers; isInbox: boolean }) => (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
        selectedMessage?.id === message.id ? 'bg-blue-50 border-blue-200' : ''
      }`}
      onClick={() => handleMessageClick(message)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {isInbox ? (
              `${message.sender.first_name} ${message.sender.last_name}`
            ) : (
              `To: ${message.recipient.first_name} ${message.recipient.last_name}`
            )}
          </span>
          {isInbox && !message.is_read && (
            <Badge variant="secondary" className="text-xs">
              New
            </Badge>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(message.created_at)}
        </span>
      </div>
      <div className="font-medium text-sm mb-1">{message.subject}</div>
      <div className="text-sm text-gray-600 truncate">
        {message.body}
      </div>
    </div>
  );

  const MessageDetail = ({ message }: { message: MessageWithUsers }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">{message.subject}</CardTitle>
        <div className="text-sm text-gray-600 space-y-1">
          <div>
            <strong>From:</strong> {message.sender.first_name} {message.sender.last_name} ({message.sender.email})
          </div>
          <div>
            <strong>To:</strong> {message.recipient.first_name} {message.recipient.last_name} ({message.recipient.email})
          </div>
          <div>
            <strong>Date:</strong> {formatDate(message.created_at)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="whitespace-pre-wrap">{message.body}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">📧 Internal Email</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {session.user.first_name} {session.user.last_name}
          </span>
          <Button onClick={onComposeClick} className="bg-blue-600 hover:bg-blue-700">
            ✏️ Compose
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">
                📥 Inbox ({inboxMessages.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                📤 Sent ({sentMessages.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inbox" className="mt-4">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading messages...</div>
                ) : inboxMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📭</div>
                    <div>No messages in your inbox</div>
                  </div>
                ) : (
                  inboxMessages.map((message: MessageWithUsers) => (
                    <MessageItem key={message.id} message={message} isInbox={true} />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sent" className="mt-4">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading messages...</div>
                ) : sentMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📮</div>
                    <div>No sent messages</div>
                  </div>
                ) : (
                  sentMessages.map((message: MessageWithUsers) => (
                    <MessageItem key={message.id} message={message} isInbox={false} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-2">
          {selectedMessage ? (
            <MessageDetail message={selectedMessage} />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📧</div>
                <div>Select a message to view</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
