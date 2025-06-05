
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactExchange } from './ContactExchange';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';

interface BookRequest {
  id: string;
  status: string;
  message: string;
  created_at: string;
  book_id: string;
  requester_id: string;
  donor_id: string;
  books: {
    title: string;
    author: string;
  };
}

interface ContactExchange {
  id: string;
  request_id: string;
  donor_phone: string;
  donor_address: string;
  requester_phone: string;
  requester_address: string;
}

export const MyRequests = () => {
  const [sentRequests, setSentRequests] = useState<BookRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<BookRequest[]>([]);
  const [contactExchanges, setContactExchanges] = useState<{ [key: string]: ContactExchange }>({});
  const [loading, setLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchRequests = async () => {
    if (!user) return;

    try {
      // Fetch requests I sent
      const { data: sent, error: sentError } = await supabase
        .from('book_requests')
        .select(`
          *,
          books (title, author)
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      // Fetch requests I received
      const { data: received, error: receivedError } = await supabase
        .from('book_requests')
        .select(`
          *,
          books (title, author)
        `)
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      setSentRequests(sent || []);
      setReceivedRequests(received || []);

      // Fetch contact exchanges for approved requests
      const allRequests = [...(sent || []), ...(received || [])];
      const approvedRequestIds = allRequests
        .filter(req => req.status === 'approved')
        .map(req => req.id);

      if (approvedRequestIds.length > 0) {
        const { data: exchanges, error: exchangeError } = await supabase
          .from('contact_exchanges')
          .select('*')
          .in('request_id', approvedRequestIds);

        if (exchangeError) throw exchangeError;

        const exchangeMap: { [key: string]: ContactExchange } = {};
        exchanges?.forEach(exchange => {
          exchangeMap[exchange.request_id] = exchange;
        });
        setContactExchanges(exchangeMap);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const createNotification = async (userId: string, type: string, title: string, message: string) => {
    try {
      await supabase.rpc('create_book_notification', {
        user_id: userId,
        notification_type: type,
        notification_title: title,
        notification_message: message
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleRequestResponse = async (requestId: string, status: 'approved' | 'rejected', requesterId: string, bookTitle: string) => {
    if (processingRequests.has(requestId)) return;

    setProcessingRequests(prev => new Set(prev).add(requestId));

    try {
      const { error } = await supabase
        .from('book_requests')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for requester
      await createNotification(
        requesterId,
        'request_response',
        `Book Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        `Your request for "${bookTitle}" has been ${status}.`
      );

      // Create notification for donor
      if (user) {
        await createNotification(
          user.id,
          'request_action',
          'Request Updated',
          `You have ${status} the request for "${bookTitle}".`
        );
      }

      toast({
        title: "Request Updated",
        description: `Request has been ${status}.`,
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-lg">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center text-white">
        <h2 className="text-3xl font-bold mb-2">My Requests</h2>
        <p className="text-blue-100">Manage your book requests and donations</p>
      </div>

      {/* Requests I Sent */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Requests I Sent</h3>
        {sentRequests.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center py-8">
            <CardContent>
              <BookOpen className="mx-auto h-8 w-8 text-white/60 mb-3" />
              <p className="text-white/80">You haven't sent any requests yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sentRequests.map((request) => (
              <div key={request.id} className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{request.books.title}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>
                    <CardDescription>by {request.books.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-2">{request.message}</p>
                    <p className="text-xs text-gray-500">
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>

                {request.status === 'approved' && (
                  <ContactExchange
                    requestId={request.id}
                    isDonor={false}
                    onContactShared={fetchRequests}
                    existingExchange={contactExchanges[request.id]}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Requests I Received */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">Requests for My Books</h3>
        {receivedRequests.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center py-8">
            <CardContent>
              <BookOpen className="mx-auto h-8 w-8 text-white/60 mb-3" />
              <p className="text-white/80">No one has requested your books yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {receivedRequests.map((request) => (
              <div key={request.id} className="space-y-4">
                <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{request.books.title}</CardTitle>
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                    </div>
                    <CardDescription>by {request.books.author}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">{request.message}</p>
                    <p className="text-xs text-gray-500">
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRequestResponse(request.id, 'approved', request.requester_id, request.books.title)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={processingRequests.has(request.id)}
                        >
                          {processingRequests.has(request.id) ? 'Processing...' : 'Approve'}
                        </Button>
                        <Button
                          onClick={() => handleRequestResponse(request.id, 'rejected', request.requester_id, request.books.title)}
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          disabled={processingRequests.has(request.id)}
                        >
                          {processingRequests.has(request.id) ? 'Processing...' : 'Reject'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {request.status === 'approved' && (
                  <ContactExchange
                    requestId={request.id}
                    isDonor={true}
                    onContactShared={fetchRequests}
                    existingExchange={contactExchanges[request.id]}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
