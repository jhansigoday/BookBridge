
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BooksList } from './BooksList';
import { DonateBooks } from './DonateBooks';
import { MyRequests } from './MyRequests';
import { Notifications } from './Notifications';
import { LogOut, Book, Heart, Bell, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type DashboardView = 'books' | 'donate' | 'requests' | 'notifications';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('books');

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const renderView = () => {
    switch (currentView) {
      case 'books':
        return <BooksList />;
      case 'donate':
        return <DonateBooks />;
      case 'requests':
        return <MyRequests />;
      case 'notifications':
        return <Notifications />;
      default:
        return <BooksList />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">BridgeBook</h1>
          <div className="flex items-center gap-4">
            <span className="text-white/80 flex items-center gap-2">
              <User size={16} />
              {user?.email}
            </span>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-4">
            <Button
              onClick={() => setCurrentView('books')}
              variant={currentView === 'books' ? 'secondary' : 'ghost'}
              className={currentView === 'books' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}
            >
              <Book size={16} className="mr-2" />
              Browse Books
            </Button>
            <Button
              onClick={() => setCurrentView('donate')}
              variant={currentView === 'donate' ? 'secondary' : 'ghost'}
              className={currentView === 'donate' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}
            >
              <Heart size={16} className="mr-2" />
              Donate Books
            </Button>
            <Button
              onClick={() => setCurrentView('requests')}
              variant={currentView === 'requests' ? 'secondary' : 'ghost'}
              className={currentView === 'requests' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}
            >
              My Requests
            </Button>
            <Button
              onClick={() => setCurrentView('notifications')}
              variant={currentView === 'notifications' ? 'secondary' : 'ghost'}
              className={currentView === 'notifications' ? 'bg-white text-blue-600' : 'text-white hover:bg-white/10'}
            >
              <Bell size={16} className="mr-2" />
              Notifications
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderView()}
      </main>
    </div>
  );
};
