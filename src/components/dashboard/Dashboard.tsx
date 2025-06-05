
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BooksList } from './BooksList';
import { DonateBooks } from './DonateBooks';
import { MyRequests } from './MyRequests';
import { Notifications } from './Notifications';
import { FreeBooks } from './FreeBooks';
import { BookOpen, Plus, MessageSquare, Bell, Eye } from 'lucide-react';

type ActiveTab = 'browse' | 'free-books' | 'donate' | 'requests' | 'notifications';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const { signOut } = useAuth();

  const tabs = [
    { id: 'browse' as const, label: 'Browse Books', icon: BookOpen },
    { id: 'free-books' as const, label: 'Free Books', icon: Eye },
    { id: 'donate' as const, label: 'Donate Books', icon: Plus },
    { id: 'requests' as const, label: 'My Requests', icon: MessageSquare },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'browse':
        return <BooksList />;
      case 'free-books':
        return <FreeBooks />;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">BridgeBook</h1>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white/5 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-white text-white'
                      : 'border-transparent text-white/70 hover:text-white hover:border-white/30'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};
