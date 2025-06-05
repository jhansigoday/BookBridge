
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
}

export const BooksList = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('status', 'available')
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

  const handleRequestBook = async (book: Book) => {
    if (!user) return;

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
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          userid: book.donorid,
          type: 'book_request',
          title: 'New Book Request',
          message: `Someone wants to borrow your book "${book.title}"`
        });

      if (notificationError) throw notificationError;

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
    }
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
                {book.isfeatured && (
                  <Badge className="w-fit mb-2 bg-yellow-500 text-yellow-900">Featured</Badge>
                )}
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
                    >
                      Request Book
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
