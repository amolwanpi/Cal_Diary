import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface WeightPredictorProps {
  user: UserProfile;
  tdee: number;
}

const WeightPredictor: React.FC<WeightPredictorProps> = ({ user, tdee }) => {
  // Logic: Sedentary person, aiming for ~500kcal deficit strictly from diet
  const dailyDeficit = 500; 
  const weightToLose = user.weight - user.targetWeight;
  
  // 7700 kcal = ~1kg of fat
  const daysToGoal = weightToLose > 0 ? Math.ceil((weightToLose * 7700) / dailyDeficit) : 0;
  
  const predictionData = useMemo(() => {
    if (daysToGoal <= 0) return [];
    
    const data = [];
    const points = 10; // Number of data points for graph
    const step = Math.ceil(daysToGoal / points);
    
    for (let i = 0; i <= points; i++) {
      const day = Math.min(i * step, daysToGoal);
      const weightLost = (day * dailyDeficit) / 7700;
      data.push({
        day: `วันที่ ${day}`,
        weight: Number((user.weight - weightLost).toFixed(1))
      });
    }
    return data;
  }, [user.weight, daysToGoal, dailyDeficit]);

  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + daysToGoal);

  if (weightToLose <= 0) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-200"></div>
        <h3 className="text-xl font-bold text-emerald-500 mb-2">ผอมแล้วจ้า! 🎉</h3>
        <p className="text-gray-500">น้ำหนักถึงเป้าหมายแล้ว เก่งมาก!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-violet-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-violet-50 rounded-full opacity-50 z-0"></div>

      <div className="flex items-start justify-between mb-4 z-10 relative">
        <div>
          <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
            <Sparkles className="text-violet-400" size={20} />
            อนาคตหุ่นสวย
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            แค่ลดวันละ 500 kcal (ไม่ออกกำลังกาย)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6 bg-violet-50 p-4 rounded-2xl border border-violet-100 relative z-10">
        <div className="bg-white p-3 rounded-xl text-violet-400 shadow-sm">
            <Calendar size={24} />
        </div>
        <div>
            <p className="text-xs text-violet-400 font-medium">เป้าหมาย {user.targetWeight} กก.</p>
            <p className="text-xl font-bold text-violet-600">{daysToGoal} วัน <span className="text-xs font-normal text-violet-400">({projectedDate.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })})</span></p>
        </div>
      </div>

      <div className="h-48 w-full mt-4 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={predictionData}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="day" hide />
            <YAxis 
                domain={['auto', 'auto']} 
                fontSize={12} 
                tickFormatter={(val) => `${val}`} 
                stroke="#d1d5db"
                tickLine={false}
                axisLine={false}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#7c3aed' }}
                itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
                labelStyle={{ display: 'none' }}
                formatter={(value: number) => [`${value} kg`, 'น้ำหนัก']}
            />
            <Area type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeightPredictor;