import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';
import { BookOpen, User as UserIcon, Lock, ArrowLeft } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('لطفا نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    if (isLogin) {
      const user = storageService.findUser(formData.username);
      if (user && user.passwordHash === formData.password) {
        storageService.loginUser(user);
        onLogin(user);
      } else {
        setError('نام کاربری یا رمز عبور اشتباه است.');
      }
    } else {
      if (!formData.name) {
        setError('لطفا نام خود را وارد کنید.');
        return;
      }
      if (storageService.findUser(formData.username)) {
        setError('این نام کاربری قبلا ثبت شده است.');
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        username: formData.username,
        passwordHash: formData.password,
        name: formData.name
      };
      storageService.saveUser(newUser);
      storageService.loginUser(newUser);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-magical-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row-reverse">
        
        {/* Form Section */}
        <div className="w-full p-8">
          <div className="text-center mb-8">
            <div className="bg-magical-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-magical-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isLogin ? 'ورود به حساب' : 'ایجاد حساب کاربری'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              به دنیای قصه‌های جادویی خوش آمدید
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <UserIcon className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="نام نمایشی"
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magical-400 focus:border-transparent outline-none transition"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div className="relative">
              <UserIcon className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="نام کاربری"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magical-400 focus:border-transparent outline-none transition"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="relative">
              <Lock className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="password"
                placeholder="رمز عبور"
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-magical-400 focus:border-transparent outline-none transition"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-magical-600 hover:bg-magical-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-magical-500/30 flex items-center justify-center gap-2"
            >
              {isLogin ? 'ورود' : 'ثبت نام'}
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-magical-600 hover:text-magical-800 text-sm font-medium transition"
            >
              {isLogin ? 'حساب کاربری ندارید؟ ثبت نام کنید' : 'قبلا ثبت نام کرده‌اید؟ وارد شوید'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;