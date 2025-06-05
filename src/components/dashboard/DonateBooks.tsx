
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Book } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  condition: string;
  status: string;
  createdat: string;
}

const categories = [
  { value: 'academic', label: 'Academic' },
  { value: 'competitive', label: 'Competitive' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'funny', label: 'Funny' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'biography', label: 'Biography' },
  { value: 'self-help', label: 'Self-Help' }
];

const conditions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' }
];

export const DonateBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    condition: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.category || !formData.condition) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including category and condition.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('books')
        .insert({
          title: formData.title,
          author: formData.author,
          description: formData.description,
          category: formData.category,
          condition: formData.condition,
          donorid: user.id,
          status: 'available'
        });

      if (error) throw error;

      // Create notification for the user
      await createNotification(
        user.id,
        'book_added',
        'Book Added Successfully',
        `Your book "${formData.title}" has been added and is now available for others to request.`
      );

      toast({
        title: "Book Added",
        description: `"${formData.title}" has been added to your donated books.`,
      });

      setFormData({ title: '', author: '', description: '', category: '', condition: '' });
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

      // Create notification for the user
      if (user) {
        await createNotification(
          user.id,
          'book_removed',
          'Book Removed',
          `Your book "${title}" has been removed from donations.`
        );
      }

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    <div className="flex-1">
                      <div className="flex gap-2 mb-2">
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
