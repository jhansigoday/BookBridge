
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Book } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  status: string;
  createdat: string;
}

export const DonateBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
  });
  const { user } = useAuth();

  const fetchMyBooks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('donorid', user.id)
        .order('createdat', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching my books:', error);
    }
  };

  useEffect(() => {
    fetchMyBooks();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .insert({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          donorid: user.id,
          status: 'available'
        });

      if (error) throw error;

      toast({
        title: "Book Added",
        description: `"${formData.title}" has been added to your donated books.`,
      });

      setFormData({ title: '', author: '', description: '' });
      setShowForm(false);
      fetchMyBooks();
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Error",
        description: "Failed to add book. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      toast({
        title: "Book Removed",
        description: `"${title}" has been removed from your donations.`,
      });

      fetchMyBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
      toast({
        title: "Error",
        description: "Failed to remove book. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center text-white">
        <h2 className="text-3xl font-bold mb-2">Donate Books</h2>
        <p className="text-blue-100">Share your books with the community</p>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-white text-blue-600 hover:bg-blue-50"
        >
          <Plus size={16} className="mr-2" />
          {showForm ? 'Cancel' : 'Add New Book'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Add a New Book</CardTitle>
            <CardDescription>Fill in the details of the book you want to donate</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the book..."
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? 'Adding Book...' : 'Add Book'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white text-center">Your Donated Books</h3>
        
        {books.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center py-12">
            <CardContent>
              <Book className="mx-auto h-12 w-12 text-white/60 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No Books Donated Yet</h4>
              <p className="text-white/80">Start by adding your first book to help the community!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <Card key={book.id} className="bg-white/95 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{book.title}</CardTitle>
                      <CardDescription>by {book.author}</CardDescription>
                    </div>
                    <Button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {book.description && (
                    <p className="text-sm text-gray-600">{book.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {book.status}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Added {new Date(book.createdat).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
