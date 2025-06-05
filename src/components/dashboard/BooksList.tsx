
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BookOpen, User } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  coverurl: string;
  status: string;
  isfeatured: boolean;
  donorid: string;
  category: string;
  condition: string;
}

export const BooksList = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingBooks, setRequestingBooks] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'available')
        .eq('is_free_to_read', false)
        .order('createdat', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({
        title: "Error",
        description: "Failed to load books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

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

  const handleRequestBook = async (book: Book) => {
    if (!user || requestingBooks.has(book.id)) return;

    setRequestingBooks(prev => new Set(prev).add(book.id));

    try {
      // Check if user already requested this book
      const { data: existingRequest } = await supabase
        .from('book_requests')
        .select('id')
        .eq('book_id', book.id)
        .eq('requester_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingRequest) {
        toast({
          title: "Already Requested",
          description: "You have already requested this book.",
          variant: "destructive",
        });
        return;
      }

      // Create book request
      const { error: requestError } = await supabase
        .from('book_requests')
        .insert({
          book_id: book.id,
          requester_id: user.id,
          donor_id: book.donorid,
          message: `I would like to borrow "${book.title}" by ${book.author}.`
        });

      if (requestError) throw requestError;

      // Create notification for donor
      await createNotification(
        book.donorid,
        'book_request',
        'New Book Request',
        `Someone wants to borrow your book "${book.title}"`
      );

      // Create notification for requester
      await createNotification(
        user.id,
        'request_sent',
        'Request Sent',
        `Your request for "${book.title}" has been sent to the donor.`
      );

      toast({
        title: "Request Sent",
        description: `Your request for "${book.title}" has been sent to the donor.`,
      });

    } catch (error) {
      console.error('Error requesting book:', error);
      toast({
        title: "Error",
        description: "Failed to send book request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequestingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      academic: 'bg-blue-100 text-blue-800 border-blue-200',
      competitive: 'bg-purple-100 text-purple-800 border-purple-200',
      adventure: 'bg-green-100 text-green-800 border-green-200',
      funny: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      romance: 'bg-pink-100 text-pink-800 border-pink-200',
      mystery: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      biography: 'bg-gray-100 text-gray-800 border-gray-200',
      'self-help': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800 border-green-200',
      good: 'bg-blue-100 text-blue-800 border-blue-200',
      fair: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white text-lg">Loading books...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-white">
        <h2 className="text-3xl font-bold mb-2">Available Books</h2>
        <p className="text-blue-100">Discover books shared by our community</p>
      </div>

      {books.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center py-12">
          <CardContent>
            <BookOpen className="mx-auto h-12 w-12 text-white/60 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Books Available</h3>
            <p className="text-white/80">Be the first to donate a book to the community!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <Card key={book.id} className="bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2">
                    {book.category && (
                      <Badge className={getCategoryColor(book.category)}>
                        {book.category}
                      </Badge>
                    )}
                    {book.condition && (
                      <Badge className={getConditionColor(book.condition)}>
                        {book.condition}
                      </Badge>
                    )}
                  </div>
                  {book.isfeatured && (
                    <Badge className="bg-yellow-500 text-yellow-900">Featured</Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{book.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <User size={14} />
                  by {book.author}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {book.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">{book.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {book.status}
                  </Badge>
                  {user?.id !== book.donorid && (
                    <Button
                      onClick={() => handleRequestBook(book)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={requestingBooks.has(book.id)}
                    >
                      {requestingBooks.has(book.id) ? 'Requesting...' : 'Request Book'}
                    </Button>
                  )}
                  {user?.id === book.donorid && (
                    <Badge variant="secondary">Your Book</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
