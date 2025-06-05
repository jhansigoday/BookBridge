
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export const MyRequests = () => {
  const [sentRequests, setSentRequests] = useState<BookRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleRequestResponse = async (requestId: string, status: 'approved' | 'rejected', requesterId: string, bookTitle: string) => {
    try {
      const { error } = await supabase
        .from('book_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for requester
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          userid: requesterId,
          type: 'request_response',
          title: `Book Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: `Your request for "${bookTitle}" has been ${status}.`
        });

      if (notificationError) throw notificationError;

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
              <Card key={request.id} className="bg-white/95 backdrop-blur-sm shadow-lg">
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
              <Card key={request.id} className="bg-white/95 backdrop-blur-sm shadow-lg">
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
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleRequestResponse(request.id, 'rejected', request.requester_id, request.books.title)}
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
