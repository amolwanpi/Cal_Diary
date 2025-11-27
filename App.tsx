import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Gender, DailyLog, MealSuggestion } from './types';
import { analyzeFood, suggestMealPlan, getHealthAdvice, suggestFoodForRemaining } from './services/geminiService';
import WaterTracker from './components/WaterTracker';
import WeightPredictor from './components/WeightPredictor';
import { 
  Activity, 
  Utensils, 
  User, 
  PlusCircle, 
  Flame,
  BrainCircuit,
  Loader2,
  Trash2,
  Lightbulb,
  X,
  Heart
} from 'lucide-react';

const INITIAL_PROFILE: UserProfile = {
  name: '',
  age: 25,
  gender: Gender.FEMALE,
  height: 160,
  weight: 65,
  targetWeight: 55,
  activityLevel: 1.2, // Sedentary default
};

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meals' | 'profile'>('profile');
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isProfileSet, setIsProfileSet] = useState(false);
  
  // Initialize todayLog from localStorage based on current date
  const [todayLog, setTodayLog] = useState<DailyLog>(() => {
    if (typeof window === 'undefined') return { date: new Date().toDateString(), foods: [], waterIntake: 0 };
    
    const todayKey = new Date().toDateString();
    const savedLogs = localStorage.getItem('lazyfit_daily_logs');
    if (savedLogs) {
        const parsed = JSON.parse(savedLogs);
        if (parsed[todayKey]) return parsed[todayKey];
    }
    return { date: todayKey, foods: [], waterIntake: 0 };
  });
  
  // Input states
  const [foodInput, setFoodInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealSuggestion[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  
  // Suggestion State
  const [isSuggestingRemaining, setIsSuggestingRemaining] = useState(false);
  const [remainingSuggestions, setRemainingSuggestions] = useState<MealSuggestion[]>([]);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  // Calculations
  const bmi = useMemo(() => {
    const hMeter = profile.height / 100;
    return profile.weight / (hMeter * hMeter);
  }, [profile.weight, profile.height]);

  const bmr = useMemo(() => {
    // Mifflin-St Jeor Equation
    if (profile.gender === Gender.MALE) {
      return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
    } else {
      return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
    }
  }, [profile]);

  const tdee = bmr * profile.activityLevel;
  const targetCalories = Math.floor(tdee - 500); // 500 deficit
  const consumedCalories = todayLog.foods.reduce((acc, curr) => acc + curr.calories, 0);
  const remainingCalories = Math.max(0, targetCalories - consumedCalories);

  // Persistence Effects
  useEffect(() => {
    const savedProfile = localStorage.getItem('lazyfit_profile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      setIsProfileSet(true);
      setActiveTab('dashboard');
    }
  }, []);

  useEffect(() => {
    if (isProfileSet) {
        localStorage.setItem('lazyfit_profile', JSON.stringify(profile));
    }
  }, [profile, isProfileSet]);

  // Save Daily Log whenever it changes
  useEffect(() => {
      const todayKey = new Date().toDateString();
      const savedLogs = localStorage.getItem('lazyfit_daily_logs');
      const logs = savedLogs ? JSON.parse(savedLogs) : {};
      
      logs[todayKey] = todayLog;
      localStorage.setItem('lazyfit_daily_logs', JSON.stringify(logs));
  }, [todayLog]);

  // Migration check for water unit (if user had old data in glasses)
  useEffect(() => {
     if (todayLog.waterIntake > 0 && todayLog.waterIntake < 50) {
        setTodayLog(prev => ({
            ...prev,
            waterIntake: prev.waterIntake * 250
        }));
     }
  }, [todayLog.waterIntake]);


  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProfileSet(true);
    setActiveTab('dashboard');
  };

  const handleFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput.trim()) return;

    setIsAnalyzing(true);
    const result = await analyzeFood(foodInput);
    if (result) {
      setTodayLog(prev => ({
        ...prev,
        foods: [...prev.foods, result]
      }));
      setFoodInput('');
    }
    setIsAnalyzing(false);
  };

  const generatePlan = async () => {
    setIsGeneratingPlan(true);
    const plan = await suggestMealPlan(targetCalories);
    setMealPlan(plan);
    setIsGeneratingPlan(false);
  };
  
  const handleSuggestRemaining = async () => {
      setIsSuggestingRemaining(true);
      setShowSuggestionModal(true);
      const suggestions = await suggestFoodForRemaining(remainingCalories);
      setRemainingSuggestions(suggestions);
      setIsSuggestingRemaining(false);
  };
  
  const refreshAdvice = async () => {
      const glassesApprox = Math.round(todayLog.waterIntake / 250);
      const advice = await getHealthAdvice(profile, { calories: consumedCalories, water: glassesApprox });
      setAiAdvice(advice);
  }

  useEffect(() => {
    if(activeTab === 'dashboard' && isProfileSet) {
        refreshAdvice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, todayLog.waterIntake, consumedCalories]);


  const renderProfile = () => (
    <div className="max-w-md mx-auto p-8 bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-rose-100 mt-10 border border-white">
      <div className="text-center mb-8">
        <div className="inline-block p-3 bg-rose-100 rounded-full mb-4">
             <Heart className="text-rose-400 fill-rose-400" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-700">เริ่มกันเลย!</h1>
        <p className="text-gray-400">มาตั้งค่าส่วนตัวกันนิดนึงนะ</p>
      </div>
      <form onSubmit={handleProfileSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">ชื่อเล่น</label>
          <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-gray-700 transition" placeholder="ชื่ออะไรคะ?" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">อายุ (ปี)</label>
            <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: Number(e.target.value)})} className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-gray-700 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">เพศ</label>
            <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value as Gender})} className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-gray-700 transition">
              <option value={Gender.MALE}>ชาย</option>
              <option value={Gender.FEMALE}>หญิง</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">ส่วนสูง (cm)</label>
            <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: Number(e.target.value)})} className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-gray-700 transition" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">น้ำหนัก (kg)</label>
            <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: Number(e.target.value)})} className="w-full p-4 bg-rose-50/50 border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-300 outline-none text-gray-700 transition" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1 ml-1">อยากหนักเท่าไหร่? (kg)</label>
          <input type="number" value={profile.targetWeight} onChange={e => setProfile({...profile, targetWeight: Number(e.target.value)})} className="w-full p-4 border-2 border-rose-200 rounded-2xl bg-white text-rose-500 font-bold focus:ring-2 focus:ring-rose-300 outline-none transition text-lg" required />
        </div>
        
        <div className="bg-orange-50 p-4 rounded-2xl text-sm text-orange-600 border border-orange-100 flex gap-2">
             <span className="text-lg">🛋️</span>
             <span>ระบบจะคำนวณแบบ <b>"ขยับตัวน้อย"</b> ให้ เพื่อให้ลดน้ำหนักได้ง่ายๆ โดยไม่ต้องออกกำลังกายหนัก</span>
        </div>

        <button type="submit" className="w-full bg-gradient-to-r from-rose-400 to-pink-400 text-white py-4 rounded-2xl font-bold text-lg hover:from-rose-500 hover:to-pink-500 transition shadow-lg shadow-rose-200 active:scale-[0.98]">
          พร้อมแล้ว ลุยเลย!
        </button>
      </form>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 pb-28">
      {/* Header Stats */}
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-rose-50">
            <div>
                <h2 className="text-2xl font-bold text-gray-700">หวัดดีจ้ะ, {profile.name} ✨</h2>
                <p className="text-sm text-gray-400 font-light">{new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long'})}</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-sm ${bmi < 23 ? 'bg-emerald-100 text-emerald-600' : bmi < 25 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                BMI {bmi.toFixed(1)}
            </div>
      </div>

      {/* Calories Overview */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-orange-50 space-y-5 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-orange-50 rounded-full opacity-50 z-0"></div>

        <div className="flex justify-between items-end relative z-10">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-100 rounded-full text-orange-500">
                    <Flame size={20} className="fill-orange-500" />
                </div>
                โควต้าวันนี้
            </h3>
            <span className="text-sm text-gray-400 font-medium">เป้า {targetCalories} kcal</span>
        </div>

        <div className="relative pt-2 z-10">
            <div className="flex mb-2 items-center justify-between">
                <div>
                    <span className="text-xs font-bold inline-block py-1 px-3 uppercase rounded-full text-orange-500 bg-orange-100">
                        กินไปแล้ว
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold inline-block text-orange-400">
                        {Math.round((consumedCalories / targetCalories) * 100)}%
                    </span>
                </div>
            </div>
            <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-orange-50">
                <div style={{ width: `${Math.min((consumedCalories / targetCalories) * 100, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-300 rounded-full transition-all duration-700 ease-out"></div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
             <div className="p-4 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                 <p className="text-xs text-gray-400 mb-1">กินไป (kcal)</p>
                 <p className="text-2xl font-bold text-gray-600">{consumedCalories}</p>
             </div>
             <div className="p-4 rounded-3xl bg-orange-50 border border-orange-100 text-center relative group">
                 <p className="text-xs text-orange-400 mb-1">กินได้อีก (kcal)</p>
                 <p className="text-2xl font-bold text-orange-500">{remainingCalories}</p>
                 
                 {remainingCalories > 0 && (
                     <button 
                        onClick={handleSuggestRemaining}
                        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-white shadow-md border border-orange-100 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-orange-50 transition whitespace-nowrap"
                     >
                        <Lightbulb size={12} /> กินไรดี?
                     </button>
                 )}
             </div>
        </div>
      </div>

      {/* Suggestions Modal */}
      {showSuggestionModal && (
          <div className="fixed inset-0 bg-rose-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 relative animate-[fadeIn_0.3s_ease-out] shadow-2xl">
                  <button onClick={() => setShowSuggestionModal(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 bg-gray-50 rounded-full p-1">
                      <X size={20} />
                  </button>
                  
                  <h3 className="text-xl font-bold text-gray-700 mb-1 flex items-center gap-2">
                     <div className="bg-orange-100 p-2 rounded-full">
                        <BrainCircuit className="text-orange-400" size={20} />
                     </div>
                     AI แนะนำเมนู
                  </h3>
                  <p className="text-sm text-gray-400 mb-6 pl-12">เหลือ {remainingCalories} kcal กินนี่สิ!</p>

                  {isSuggestingRemaining ? (
                      <div className="py-12 flex flex-col items-center justify-center text-rose-300">
                          <Loader2 className="animate-spin mb-3" size={40} />
                          <p className="text-sm font-medium">กำลังเลือกเมนูอร่อยๆ...</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {remainingSuggestions.map((item, idx) => (
                              <div key={idx} className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 hover:bg-orange-50 transition">
                                  <div className="flex justify-between items-start mb-1">
                                      <span className="font-bold text-gray-700">{item.mealName}</span>
                                      <span className="text-orange-500 font-bold text-sm bg-white px-2 py-0.5 rounded-lg shadow-sm">{item.calories} kcal</span>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed font-light">{item.description}</p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* AI Advice Bubble */}
      {aiAdvice && (
          <div className="bg-gradient-to-br from-violet-400 to-fuchsia-400 p-5 rounded-3xl text-white shadow-lg shadow-violet-200 flex items-start gap-4">
             <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <BrainCircuit className="w-6 h-6 flex-shrink-0 text-white" />
             </div>
             <div>
                 <p className="font-bold text-sm opacity-90 mb-1">พี่ AI ฝากบอกว่า...</p>
                 <p className="text-sm leading-relaxed font-medium opacity-95">{aiAdvice}</p>
             </div>
          </div>
      )}

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <WaterTracker 
          currentMl={todayLog.waterIntake}
          onAdd={(amount) => setTodayLog({...todayLog, waterIntake: Math.max(0, todayLog.waterIntake + amount)})}
        />
        <WeightPredictor user={profile} tdee={tdee} />
      </div>

      {/* Food Logger */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <div className="p-2 bg-rose-100 rounded-full text-rose-400">
                 <Utensils size={20} />
            </div>
            จดรายการอาหาร
        </h3>
        
        <form onSubmit={handleFoodSubmit} className="flex gap-2 mb-6">
            <input 
                type="text" 
                value={foodInput}
                onChange={(e) => setFoodInput(e.target.value)}
                placeholder="เช่น ชานมไข่มุกหวานน้อย..."
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-gray-600 focus:ring-2 focus:ring-rose-200 outline-none transition placeholder-gray-300"
            />
            <button 
                type="submit" 
                disabled={isAnalyzing}
                className="bg-rose-400 text-white p-3 rounded-2xl hover:bg-rose-500 disabled:opacity-50 transition shadow-md shadow-rose-100"
            >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <PlusCircle />}
            </button>
        </form>

        <div className="space-y-3">
            {todayLog.foods.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">ยังไม่ได้กินอะไรหรอ? จดเลย!</p>
                </div>
            ) : (
                todayLog.foods.slice().reverse().map((food, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                        <div>
                            <p className="font-bold text-gray-700">{food.name}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-red-50 text-red-400 px-1.5 py-0.5 rounded-md">P: {food.protein}</span>
                                <span className="text-[10px] bg-amber-50 text-amber-400 px-1.5 py-0.5 rounded-md">C: {food.carbs}</span>
                                <span className="text-[10px] bg-yellow-50 text-yellow-500 px-1.5 py-0.5 rounded-md">F: {food.fat}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-rose-400">{food.calories}</span>
                            <button 
                                onClick={() => {
                                    const realIdx = todayLog.foods.length - 1 - idx;
                                    const newFoods = todayLog.foods.filter((_, i) => i !== realIdx);
                                    setTodayLog({...todayLog, foods: newFoods});
                                }}
                                className="text-gray-300 hover:text-rose-400 bg-gray-50 p-1.5 rounded-lg transition"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );

  const renderMealPlan = () => (
    <div className="pb-28">
       <div className="bg-white p-8 rounded-[2.5rem] shadow-sm mb-6 border border-emerald-50 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-200 to-teal-200"></div>
           <h2 className="text-2xl font-bold text-gray-700 mb-2">ให้ AI คิดเมนูให้ 🥗</h2>
           <p className="text-gray-400 mb-8 font-light">คุมแคลอรี่ {targetCalories} kcal แบบไม่อด</p>
           
           <button 
                onClick={generatePlan}
                disabled={isGeneratingPlan}
                className="w-full bg-gradient-to-r from-emerald-400 to-teal-400 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 hover:scale-[1.02] transition active:scale-[0.98]"
           >
                {isGeneratingPlan ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                {mealPlan.length > 0 ? 'ขอเมนูชุดใหม่' : 'จัดเมนูวันนี้ให้หน่อย'}
           </button>
       </div>

       <div className="space-y-4">
           {mealPlan.map((meal, idx) => (
               <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-emerald-200 transition group">
                   <div className="flex justify-between items-start mb-3">
                       <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
                           {meal.type === 'breakfast' ? '🍳 เช้า' : meal.type === 'lunch' ? '🍱 เที่ยง' : meal.type === 'dinner' ? '🥗 เย็น' : '🍎 ว่าง'}
                       </span>
                       <span className="font-bold text-gray-600 bg-gray-50 px-2 py-1 rounded-lg text-sm">{meal.calories} kcal</span>
                   </div>
                   <h3 className="text-lg font-bold text-gray-700 mb-2 group-hover:text-emerald-500 transition">{meal.mealName}</h3>
                   <p className="text-gray-400 text-sm leading-relaxed font-light">{meal.description}</p>
               </div>
           ))}
       </div>
    </div>
  );

  if (!isProfileSet) {
    return (
        <div className="min-h-screen p-4 flex items-center justify-center bg-rose-50/30">
            {renderProfile()}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50/30">
        {/* Main Content Area */}
        <div className="max-w-md mx-auto p-5 pt-8">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'meals' && renderMealPlan()}
            {activeTab === 'profile' && renderProfile()}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white/90 backdrop-blur-md border border-white/50 px-6 py-4 shadow-2xl shadow-rose-100/50 rounded-full z-50 flex justify-between items-center">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'dashboard' ? 'text-rose-400 -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <div className={`p-2 rounded-full ${activeTab === 'dashboard' ? 'bg-rose-50' : 'bg-transparent'}`}>
                        <Activity size={24} className={activeTab === 'dashboard' ? 'fill-rose-400' : ''} />
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('meals')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'meals' ? 'text-emerald-400 -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <div className={`p-2 rounded-full ${activeTab === 'meals' ? 'bg-emerald-50' : 'bg-transparent'}`}>
                        <Utensils size={24} className={activeTab === 'meals' ? 'fill-emerald-400' : ''} />
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-violet-400 -translate-y-1' : 'text-gray-300 hover:text-gray-400'}`}
                >
                    <div className={`p-2 rounded-full ${activeTab === 'profile' ? 'bg-violet-50' : 'bg-transparent'}`}>
                        <User size={24} className={activeTab === 'profile' ? 'fill-violet-400' : ''} />
                    </div>
                </button>
        </div>
    </div>
  );
}

export default App;