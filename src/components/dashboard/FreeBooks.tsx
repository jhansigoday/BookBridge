
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { BookOpen, User, Eye } from 'lucide-react';

interface FreeBook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  condition: string;
}

export const FreeBooks = () => {
  const [freeBooks, setFreeBooks] = useState<FreeBook[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFreeBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_free_to_read', true)
        .eq('status', 'available')
        .order('createdat', { ascending: false });

      if (error) throw error;
      setFreeBooks(data || []);
    } catch (error) {
      console.error('Error fetching free books:', error);
      toast({
        title: "Error",
        description: "Failed to load free books. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreeBooks();
  }, []);

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
        <div className="text-white text-lg">Loading free books...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-white">
        <h2 className="text-3xl font-bold mb-2">Free Books to Read</h2>
        <p className="text-blue-100">Discover amazing books you can read for free</p>
      </div>

      {freeBooks.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center py-12">
          <CardContent>
            <BookOpen className="mx-auto h-12 w-12 text-white/60 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Free Books Available</h3>
            <p className="text-white/80">Check back later for new free reading materials!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {freeBooks.map((book) => (
            <Card key={book.id} className="bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getCategoryColor(book.category)}>
                    {book.category}
                  </Badge>
                  <Badge className="bg-green-50 text-green-700 border-green-200">
                    FREE
                  </Badge>
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
                  <Badge variant="outline" className={getConditionColor(book.condition)}>
                    {book.condition}
                  </Badge>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      toast({
                        title: "Reading Mode",
                        description: `Opening "${book.title}" for reading...`,
                      });
                    }}
                  >
                    <Eye size={16} className="mr-2" />
                    Read Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
