
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Phone, MapPin, Mail } from 'lucide-react';

interface ContactExchangeProps {
  requestId: string;
  isDonor: boolean;
  onContactShared: () => void;
  existingExchange?: any;
}

export const ContactExchange = ({ 
  requestId, 
  isDonor, 
  onContactShared, 
  existingExchange 
}: ContactExchangeProps) => {
  const [phone, setPhone] = useState(existingExchange?.[isDonor ? 'donor_phone' : 'requester_phone'] || '');
  const [address, setAddress] = useState(existingExchange?.[isDonor ? 'donor_address' : 'requester_address'] || '');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !phone.trim() || !address.trim()) return;

    setLoading(true);
    try {
      const updateData = isDonor 
        ? { donor_phone: phone, donor_address: address }
        : { requester_phone: phone, requester_address: address };

      if (existingExchange) {
        const { error } = await supabase
          .from('contact_exchanges')
          .update(updateData)
          .eq('request_id', requestId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_exchanges')
          .insert({
            request_id: requestId,
            ...updateData
          });

        if (error) throw error;
      }

      toast({
        title: "Contact Shared",
        description: "Your contact details have been shared successfully.",
      });

      onContactShared();
    } catch (error) {
      console.error('Error sharing contact:', error);
      toast({
        title: "Error",
        description: "Failed to share contact details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasSharedContact = existingExchange?.[isDonor ? 'donor_phone' : 'requester_phone'];
  const otherPersonContact = existingExchange?.[isDonor ? 'requester_phone' : 'donor_phone'];
  const otherPersonAddress = existingExchange?.[isDonor ? 'requester_address' : 'donor_address'];

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail size={20} />
          Contact Exchange
        </CardTitle>
        <CardDescription>
          Share your contact details to arrange book pickup/delivery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasSharedContact ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone size={16} />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin size={16} />
                Address *
              </Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address for pickup/delivery"
                rows={3}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? 'Sharing...' : 'Share Contact Details'}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✓ Your contact details have been shared</p>
            </div>
            
            {otherPersonContact && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Contact Information:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone size={16} className="text-gray-600" />
                    <span>{otherPersonContact}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin size={16} className="text-gray-600 mt-0.5" />
                    <span>{otherPersonAddress}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
