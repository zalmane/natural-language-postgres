'use client';

import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Textarea } from '../../../components/ui/textarea';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  feedbackType: 'up' | 'down';
}

export function FeedbackModal({ isOpen, onClose, onSubmit, feedbackType }: FeedbackModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provide Additional Feedback</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your feedback is valuable in helping us improve. Please let us know the reason for your {feedbackType === 'up' ? 'positive' : 'negative'} feedback.
        </p>
        <Textarea
          placeholder="Your reason..."
          value={reason}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 