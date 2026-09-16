'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { addMoneyTaken } from '@/app/actions/money.actions';
import { toast } from 'sonner';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useGuestData } from '@/lib/guest-data';

interface AddMoneyTakenDialogProps {
  onSuccess?: () => void;
}

export function AddMoneyTakenDialog({ onSuccess }: AddMoneyTakenDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const guestData = useGuestData();
  const [hasInterest, setHasInterest] = useState(false);
  const [formData, setFormData] = useState({
    person_name: '',
    amount: '',
    taken_date: new Date().toISOString().split('T')[0],
    reason: '',
    due_date: '',
    simple_interest_rate: '',
    simple_interest_years: '',
    compound_interest_rate: '',
    compounding_frequency: '1',
    total_tenure_years: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('person_name', formData.person_name);
      fd.append('amount', formData.amount);
      fd.append('taken_date', formData.taken_date);
      fd.append('reason', formData.reason);
      fd.append('due_date', formData.due_date);
      if (hasInterest) {
        fd.append('has_interest', 'on');
        fd.append(
          'simple_interest_rate',
          formData.simple_interest_rate.toString()
        );
        fd.append(
          'simple_interest_years',
          formData.simple_interest_years.toString()
        );
        fd.append(
          'compound_interest_rate',
          formData.compound_interest_rate.toString()
        );
        fd.append(
          'compounding_frequency',
          formData.compounding_frequency.toString()
        );
        fd.append('total_tenure_years', formData.total_tenure_years.toString());
      }

      const result = guestData.isGuest
        ? {
            data: guestData.saveMoneyTaken({
              person_name: formData.person_name,
              amount: Number(formData.amount),
              taken_date: formData.taken_date,
              reason: formData.reason || null,
              due_date: formData.due_date || null,
              status: 'Pending',
              has_interest: hasInterest,
              simple_interest_rate: Number(formData.simple_interest_rate) || undefined,
              simple_interest_years: Number(formData.simple_interest_years) || undefined,
              compound_interest_rate: Number(formData.compound_interest_rate) || undefined,
              compounding_frequency: Number(formData.compounding_frequency) || undefined,
              total_tenure_years: Number(formData.total_tenure_years) || undefined,
            }),
            error: null,
          }
        : await addMoneyTaken(fd);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Entry added successfully!');
        setOpen(false);
        setFormData({
          person_name: '',
          amount: '',
          taken_date: new Date().toISOString().split('T')[0],
          reason: '',
          due_date: '',
          simple_interest_rate: '',
          simple_interest_years: '',
          compound_interest_rate: '',
          compounding_frequency: '1',
          total_tenure_years: '',
        });
        onSuccess?.();
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>🏦 Money Borrowed</DialogTitle>
          <DialogDescription>
            Record money you borrowed from someone
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="person_name">Lender Name</Label>
            <Input
              id="person_name"
              placeholder="e.g., Jane"
              value={formData.person_name}
              onChange={(e) =>
                setFormData({ ...formData, person_name: e.target.value })
              }
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taken_date">Date Borrowed</Label>
              <Input
                id="taken_date"
                type="date"
                value={formData.taken_date}
                onChange={(e) =>
                  setFormData({ ...formData, taken_date: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Repay By (Optional)</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why did you borrow the money?"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              disabled={loading}
              className="h-20"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_interest"
              checked={hasInterest}
              onCheckedChange={() => setHasInterest(!hasInterest)}
            />
            <label
              htmlFor="has_interest"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              This loan has interest
            </label>
          </div>

          {hasInterest && (
            <div className="space-y-4 rounded-md border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="simple_interest_rate">Simple Interest Rate (%)</Label>
                  <Input
                    id="simple_interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 8.5"
                    value={formData.simple_interest_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        simple_interest_rate: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="simple_interest_years">
                    Simple Interest Period (years)
                  </Label>
                  <Input
                    id="simple_interest_years"
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.simple_interest_years}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        simple_interest_years: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="compound_interest_rate">
                    Compound Interest Rate (%)
                  </Label>
                  <Input
                    id="compound_interest_rate"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 10.2"
                    value={formData.compound_interest_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        compound_interest_rate: e.target.value,
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compounding_frequency">
                    Compounding Frequency
                  </Label>
                  <Select
                    value={formData.compounding_frequency}
                    onValueChange={(value) =>
                      setFormData({ ...formData, compounding_frequency: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Annually</SelectItem>
                      <SelectItem value="4">Quarterly</SelectItem>
                      <SelectItem value="12">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_tenure_years">Total Tenure (years)</Label>
                <Input
                  id="total_tenure_years"
                  type="number"
                  placeholder="e.g., 15"
                  value={formData.total_tenure_years}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      total_tenure_years: e.target.value,
                    })
                  }
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
