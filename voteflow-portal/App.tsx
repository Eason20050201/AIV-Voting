import React, { useState } from 'react';
import { UserRole, AuthState } from './types';
import { IconVote, IconCreate, IconArrowLeft, IconMail, IconLock, IconCheck } from './components/Icons';
import { Input } from './components/Input';
import { Button } from './components/Button';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>('SELECTION');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setAuthState('LOGIN');
    // Reset form
    setEmail('');
    setPassword('');
  };

  const handleBack = () => {
    setAuthState('SELECTION');
    setSelectedRole(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setAuthState('DASHBOARD');
    }, 1500);
  };

  if (authState === 'DASHBOARD') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <IconCheck className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
            <p className="text-slate-400">You have successfully logged in as {selectedRole === UserRole.VOTER ? 'a Voter' : 'an Organizer'}.</p>
            <Button onClick={() => setAuthState('SELECTION')} variant="secondary">
                Log Out
            </Button>
        </div>
      </div>
    );
  }

  const isVoter = selectedRole === UserRole.VOTER;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="w-full max-w-5xl z-10 relative">
        
        {/* Header - Only show in selection mode or if transitioning */}
        <div className={`text-center transition-all duration-500 mb-12 ${authState === 'LOGIN' ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            <span className="text-white">Vote</span>
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 gradient-text text-transparent">Flow</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            The secure platform for real-time decision making. Choose your identity to proceed.
          </p>
        </div>

        {/* Card Container - using a grid logic for transitions */}
        <div className="relative">
            
          {/* SELECTION SCREEN */}
          <div className={`transition-all duration-500 ease-in-out transform 
            ${authState === 'SELECTION' ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95 pointer-events-none absolute top-0 w-full'}
          `}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Voter Option */}
              <button 
                onClick={() => handleRoleSelect(UserRole.VOTER)}
                className="group relative glass-panel rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 text-left border-transparent hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/20"
              >
                <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <IconVote className="w-24 h-24 text-indigo-500/10 group-hover:text-indigo-500/20 transform group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-white text-indigo-400 transition-colors duration-300">
                    <IconVote className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">我要投票</h3>
                  <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                    Join an active event, cast your vote securely, and see real-time results.
                  </p>
                  <div className="mt-8 flex items-center text-indigo-400 font-medium group-hover:text-indigo-300">
                    Login as Voter <span className="ml-2 group-hover:ml-3 transition-all">&rarr;</span>
                  </div>
                </div>
              </button>

              {/* Organizer Option */}
              <button 
                onClick={() => handleRoleSelect(UserRole.ORGANIZER)}
                className="group relative glass-panel rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 text-left border-transparent hover:border-fuchsia-500/50 hover:shadow-2xl hover:shadow-fuchsia-500/20"
              >
                 <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <IconCreate className="w-24 h-24 text-fuchsia-500/10 group-hover:text-fuchsia-500/20 transform group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-fuchsia-500/20 flex items-center justify-center mb-6 group-hover:bg-fuchsia-500 group-hover:text-white text-fuchsia-400 transition-colors duration-300">
                    <IconCreate className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:translate-x-1 transition-transform">我要創建投票</h3>
                  <p className="text-slate-400 group-hover:text-slate-300 transition-colors">
                    Create new events, manage candidates, and oversee the voting process.
                  </p>
                  <div className="mt-8 flex items-center text-fuchsia-400 font-medium group-hover:text-fuchsia-300">
                    Login as Organizer <span className="ml-2 group-hover:ml-3 transition-all">&rarr;</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* LOGIN FORM SCREEN */}
          <div className={`transition-all duration-500 ease-in-out transform
            ${authState === 'LOGIN' ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95 pointer-events-none absolute top-0 w-full'}
          `}>
             <div className="max-w-md mx-auto">
                <Button 
                    variant="ghost" 
                    onClick={handleBack} 
                    className="mb-6 pl-0 hover:bg-transparent hover:text-white text-slate-500"
                >
                    <IconArrowLeft className="w-5 h-5 mr-2" /> Back to selection
                </Button>

                <div className="glass-panel rounded-2xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
                    {/* Decorative color splash based on role */}
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${isVoter ? 'bg-indigo-500' : 'bg-fuchsia-500'}`}></div>

                    <div className="mb-8 text-center">
                        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
                            isVoter ? 'bg-indigo-500/20 text-indigo-400' : 'bg-fuchsia-500/20 text-fuchsia-400'
                        }`}>
                            {isVoter ? <IconVote className="w-8 h-8" /> : <IconCreate className="w-8 h-8" />}
                        </div>
                        <h2 className="text-2xl font-bold text-white">
                            {isVoter ? 'Voter Login' : 'Organizer Portal'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-2">
                            Enter your credentials to access the {isVoter ? 'voting area' : 'management dashboard'}.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input 
                            id="email"
                            type="email" 
                            label="Email Address" 
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<IconMail className="w-5 h-5" />}
                            required
                        />
                        
                        <div>
                            <Input 
                                id="password"
                                type="password" 
                                label="Password" 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={<IconLock className="w-5 h-5" />}
                                required
                            />
                            <div className="flex justify-end mt-2">
                                <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">Forgot password?</a>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            fullWidth 
                            disabled={loading}
                            className={!isVoter ? '!from-fuchsia-600 !to-pink-600 !shadow-fuchsia-500/25 hover:!from-fuchsia-500 hover:!to-pink-500' : ''}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-800 pt-6">
                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <a href="#" className={`font-medium hover:underline ${isVoter ? 'text-indigo-400' : 'text-fuchsia-400'}`}>
                                Register now
                            </a>
                        </p>
                    </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;