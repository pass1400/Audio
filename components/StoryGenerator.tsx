import React, { useState, useEffect } from 'react';
import { StoryGenre, StoryOptions } from '../types';
import { generateStoryWithGemini, generateStoryAudio, playAudioData, stopAudio } from '../services/geminiService';
import { Wand2, Save, RotateCcw, Loader2, Volume2, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StoryGeneratorProps {
  onSave: (storyTitle: string, storyContent: string, options: StoryOptions, audioBase64?: string) => void;
}

const StoryGenerator: React.FC<StoryGeneratorProps> = ({ onSave }) => {
  const [options, setOptions] = useState<StoryOptions>({
    prompt: '',
    genre: StoryGenre.FANTASY,
    ageGroup: '7-12',
    length: 'medium'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<{title: string, content: string} | null>(null);
  
  // Audio states
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup audio when component unmounts or story changes
    return () => {
      stopAudio();
    };
  }, []);

  const handleGenerate = async () => {
    if (!options.prompt.trim()) return;
    
    stopAudio();
    setIsPlaying(false);
    setAudioData(null);
    setIsLoading(true);
    setGeneratedStory(null);
    
    try {
      const result = await generateStoryWithGemini(options);
      setGeneratedStory(result);
    } catch (error) {
      alert("متاسفانه مشکلی در تولید داستان پیش آمد. لطفا دوباره تلاش کنید.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (generatedStory) {
      onSave(generatedStory.title, generatedStory.content, options, audioData || undefined);
      setGeneratedStory(null);
      setOptions({ ...options, prompt: '' });
      setAudioData(null);
      stopAudio();
      setIsPlaying(false);
      alert('داستان با موفقیت ذخیره شد!');
    }
  };

  const toggleAudio = async () => {
    if (!generatedStory) return;

    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      setIsAudioLoading(true);
      try {
        let currentAudio = audioData;
        
        // If we don't have the audio yet, generate it
        if (!currentAudio) {
           currentAudio = await generateStoryAudio(generatedStory.content);
           setAudioData(currentAudio);
        }

        // Start playing
        setIsPlaying(true); 
        await playAudioData(currentAudio);
        setIsPlaying(false); // Finished playing
      } catch (error) {
        setIsPlaying(false);
        alert('خطا در تولید یا پخش صوتی داستان.');
      } finally {
        setIsAudioLoading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-magical-100 p-2 rounded-lg">
            <Wand2 className="text-magical-600 w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">ساخت داستان جدید</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              موضوع داستان یا ایده اولیه
            </label>
            <textarea
              value={options.prompt}
              onChange={(e) => setOptions({...options, prompt: e.target.value})}
              placeholder="مثلا: گربه‌ای که می‌خواست پرواز کند..."
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-magical-400 focus:border-transparent outline-none h-32 resize-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ژانر داستان
            </label>
            <select
              value={options.genre}
              onChange={(e) => setOptions({...options, genre: e.target.value as StoryGenre})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-magical-400 outline-none bg-white"
            >
              {Object.values(StoryGenre).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              گروه سنی
            </label>
            <select
              value={options.ageGroup}
              onChange={(e) => setOptions({...options, ageGroup: e.target.value})}
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-magical-400 outline-none bg-white"
            >
              <option value="3-6">۳ تا ۶ سال (خردسال)</option>
              <option value="7-12">۷ تا ۱۲ سال (کودک)</option>
              <option value="13-18">۱۳ تا ۱۸ سال (نوجوان)</option>
              <option value="adult">بزرگسال</option>
            </select>
          </div>

          <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-2">
              طول داستان
            </label>
            <div className="flex gap-4">
              {['short', 'medium', 'long'].map((len) => (
                <button
                  key={len}
                  onClick={() => setOptions({...options, length: len as any})}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                    options.length === len 
                      ? 'bg-magical-50 border-magical-500 text-magical-700' 
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {len === 'short' ? 'کوتاه' : len === 'medium' ? 'متوسط' : 'طولانی'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !options.prompt}
          className={`mt-8 w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg ${
            isLoading || !options.prompt
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-magical-600 to-indigo-600 text-white hover:from-magical-700 hover:to-indigo-700 hover:shadow-magical-500/25'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              در حال نوشتن داستان...
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              بنویس!
            </>
          )}
        </button>
      </div>

      {/* Result Section */}
      {generatedStory && (
        <div className="bg-white rounded-2xl shadow-lg border border-magical-100 overflow-hidden animate-fade-in-up">
          <div className="bg-magical-50 p-6 border-b border-magical-100 flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-2xl font-bold text-magical-900">{generatedStory.title}</h3>
            <div className="flex gap-2 items-center">
              
              <button
                onClick={toggleAudio}
                disabled={isAudioLoading}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-sm ${
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
                    توقف
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    {audioData ? 'پخش مجدد' : 'بشنو'}
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  stopAudio();
                  setIsPlaying(false);
                  setGeneratedStory(null);
                  setAudioData(null);
                }}
                className="px-4 py-2 rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                دوباره
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-magical-600 text-white hover:bg-magical-700 shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                ذخیره
              </button>
            </div>
          </div>
          <div className="p-8 prose prose-lg prose-indigo max-w-none text-gray-700 leading-relaxed font-sans">
            <ReactMarkdown>{generatedStory.content}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryGenerator;