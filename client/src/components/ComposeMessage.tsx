
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { SendMessageInput, PublicUser, MessageWithUsers } from '../../../server/src/schema';

interface ComposeMessageProps {
  onMessageSent: (message: MessageWithUsers) => void;
  onCancel: () => void;
}

export function ComposeMessage({ onMessageSent, onCancel }: ComposeMessageProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [messageData, setMessageData] = useState<SendMessageInput>({
    recipient_email: '',
    subject: '',
    body: ''
  });

  const loadUsers = useCallback(async () => {
    try {
      const result = await trpc.getUsers.query();
      setUsers(result);
    } catch {
      console.error('Failed to load users');
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const message = await trpc.sendMessage.mutate(messageData);
      setSuccess('Message sent successfully!');
      onMessageSent(message);
      
      // Reset form
      setMessageData({
        recipient_email: '',
        subject: '',
        body: ''
      });
      
      // Close compose after 2 seconds
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipientChange = (email: string) => {
    setMessageData((prev: SendMessageInput) => ({
      ...prev,
      recipient_email: email
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📝 Compose Message</span>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">To</Label>
            <Select value={messageData.recipient_email || ''} onValueChange={handleRecipientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: PublicUser) => (
                  <SelectItem key={user.id} value={user.email}>
                    {user.first_name} {user.last_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={messageData.subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessageData((prev: SendMessageInput) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Enter subject"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={messageData.body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessageData((prev: SendMessageInput) => ({ ...prev, body: e.target.value }))
              }
              placeholder="Enter your message"
              rows={8}
              className="resize-vertical"
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !messageData.recipient_email}>
              {isLoading ? '📤 Sending...' : '📤 Send Message'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
        
        {error && (
          <Alert className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ {success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
