import React, { useState, useEffect } from 'react';
import { User, AppView, Story, StoryOptions } from './types';
import { storageService } from './services/storageService';
import Auth from './components/Auth';
import StoryGenerator from './components/StoryGenerator';
import SavedStories from './components/SavedStories';
import { BookOpen, LogOut, Plus, Library, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD_CREATE);
  const [stories, setStories] = useState<Story[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadStories(currentUser.id);
    }
  }, []);

  const loadStories = async (userId: string) => {
    const userStories = await storageService.getStories(userId);
    setStories(userStories);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    loadStories(loggedInUser.id);
    setCurrentView(AppView.DASHBOARD_CREATE);
  };

  const handleLogout = () => {
    storageService.logoutUser();
    setUser(null);
    setStories([]);
    setIsMobileMenuOpen(false);
  };

  const handleSaveStory = async (title: string, content: string, options: StoryOptions, audioBase64?: string) => {
    if (!user) return;
    
    const newStory: Story = {
      id: Date.now().toString(),
      userId: user.id,
      title: title,
      content: content,
      genre: options.genre,
      prompt: options.prompt,
      createdAt: Date.now(),
      audioBase64: audioBase64
    };

    await storageService.saveStory(newStory);
    await loadStories(user.id);
    // Optional: Switch to view saved stories or stay
  };

  const handleDeleteStory = async (id: string) => {
    if (!user) return;
    await storageService.deleteStory(id);
    await loadStories(user.id);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  const NavButton = ({ view, label, icon: Icon }: { view: AppView, label: string, icon: any }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`w-full md:w-auto flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
        currentView === view 
          ? 'bg-magical-100 text-magical-700 font-bold' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-magical-500 to-indigo-600 text-white p-2 rounded-lg shadow-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">قصه گوی آنلاین</h1>
                <p className="text-xs text-gray-500">StoryWeaver</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavButton view={AppView.DASHBOARD_CREATE} label="ساخت داستان" icon={Plus} />
              <NavButton view={AppView.DASHBOARD_SAVED} label="کتابخانه من" icon={Library} />
              
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              
              <div className="flex items-center gap-3 ml-2">
                 <span className="text-sm font-medium text-gray-700">سلام، {user.name}</span>
                 <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50"
                  title="خروج"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-2 pb-4 space-y-2 shadow-lg">
            <div className="py-3 border-b border-gray-100 mb-2 flex justify-between items-center">
               <span className="text-sm font-medium text-gray-900">کاربر: {user.name}</span>
               <button onClick={handleLogout} className="text-red-500 text-sm flex items-center gap-1">
                 <LogOut className="w-4 h-4" /> خروج
               </button>
            </div>
            <NavButton view={AppView.DASHBOARD_CREATE} label="ساخت داستان جدید" icon={Plus} />
            <NavButton view={AppView.DASHBOARD_SAVED} label="داستان‌های ذخیره شده" icon={Library} />
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
          {currentView === AppView.DASHBOARD_CREATE && (
            <StoryGenerator onSave={handleSaveStory} />
          )}
          
          {currentView === AppView.DASHBOARD_SAVED && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Library className="text-magical-600" />
                  کتابخانه داستان‌های من
                </h2>
                <span className="text-sm bg-magical-50 text-magical-700 px-3 py-1 rounded-full">
                  {stories.length} داستان
                </span>
              </div>
              <SavedStories stories={stories} onDelete={handleDeleteStory} />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2024 قصه گوی هوشمند فارسی. طراحی شده با عشق و هوش مصنوعی.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;