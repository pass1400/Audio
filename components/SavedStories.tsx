import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { Trash2, BookOpen, Calendar, Volume2, Square, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { playAudioData, generateStoryAudio, stopAudio } from '../services/geminiService';

interface SavedStoriesProps {
  stories: Story[];
  onDelete: (id: string) => void;
}

const SavedStories: React.FC<SavedStoriesProps> = ({ stories, onDelete }) => {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  
  // Audio state
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleBack = () => {
    stopAudio();
    setIsPlaying(false);
    setSelectedStory(null);
  }

  const toggleAudio = async () => {
    if (!selectedStory) return;

    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      setIsAudioLoading(true);
      try {
        let audioData = selectedStory.audioBase64;
        
        // Use saved audio if available
        if (!audioData) {
            // Fallback: Generate if not saved
            audioData = await generateStoryAudio(selectedStory.content);
        }

        setIsPlaying(true);
        await playAudioData(audioData);
        setIsPlaying(false);
      } catch (error) {
        setIsPlaying(false);
        alert('خطا در پخش صوتی داستان.');
      } finally {
        setIsAudioLoading(false);
      }
    }
  };

  if (stories.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-600">هنوز داستانی ذخیره نکرده‌اید</h3>
        <p className="text-gray-400 mt-2">به بخش "ساخت داستان" بروید و اولین قصه خود را بسازید.</p>
      </div>
    );
  }

  // If a story is selected for reading
  if (selectedStory) {
    return (
      <div className="animate-fade-in">
        <button 
          onClick={handleBack}
          className="mb-4 text-gray-600 hover:text-magical-600 flex items-center gap-2 font-medium"
        >
          ← بازگشت به لیست
        </button>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-magical-50 p-6 md:p-8 border-b border-magical-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-magical-900 mb-2">{selectedStory.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                 <span className="bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-magical-500"></span>
                   {selectedStory.genre}
                 </span>
                 <span className="flex items-center gap-1">
                   <Calendar className="w-4 h-4" />
                   {new Date(selectedStory.createdAt).toLocaleDateString('fa-IR')}
                 </span>
                 {selectedStory.audioBase64 && (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        فایل صوتی ذخیره شده
                    </span>
                 )}
              </div>
            </div>

            <button
                onClick={toggleAudio}
                disabled={isAudioLoading}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm whitespace-nowrap ${
                  isPlaying 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                {isAudioLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    توقف پخش
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    {selectedStory.audioBase64 ? 'پخش فایل ذخیره شده' : 'تولید و پخش صدا'}
                  </>
                )}
              </button>
          </div>
          <div className="p-8 prose prose-lg prose-indigo max-w-none text-gray-700 leading-relaxed font-sans">
             <ReactMarkdown>{selectedStory.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((story) => (
        <div 
          key={story.id} 
          className="group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden cursor-pointer"
          onClick={() => setSelectedStory(story)}
        >
          <div className="h-2 bg-gradient-to-r from-magical-400 to-indigo-500"></div>
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-magical-600 bg-magical-50 px-2 py-1 rounded-md">
                {story.genre}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if(window.confirm('آیا مطمئن هستید؟')) onDelete(story.id);
                }}
                className="text-gray-400 hover:text-red-500 transition p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-magical-700 transition-colors line-clamp-1">
              {story.title}
            </h3>
            
            <p className="text-sm text-gray-500 mb-4 line-clamp-3">
              {story.content.substring(0, 150)}...
            </p>
            
            {story.audioBase64 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
                    <Volume2 className="w-3 h-3" />
                    <span>دارای صوت</span>
                </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
             <span>{new Date(story.createdAt).toLocaleDateString('fa-IR')}</span>
             <span className="flex items-center gap-1 text-magical-600 font-medium group-hover:translate-x-[-4px] transition-transform">
               مطالعه داستان ←
             </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedStories;