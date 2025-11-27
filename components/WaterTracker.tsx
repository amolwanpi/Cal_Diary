import React from 'react';
import { Droplets, Minus, GlassWater, Milk } from 'lucide-react'; // Milk icon used as bottle proxy or similar container

interface WaterTrackerProps {
  currentMl: number;
  onAdd: (amount: number) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ currentMl, onAdd }) => {
  const goalMl = 2000; // ~8 glasses * 250ml
  const glassesEquivalent = (currentMl / 250).toFixed(1);
  const percentage = Math.min((currentMl / goalMl) * 100, 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-sky-100 flex flex-col items-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-sky-50 rounded-full opacity-50 z-0"></div>

      <div className="absolute top-0 left-0 w-full h-3 bg-sky-50 rounded-t-3xl overflow-hidden z-10">
        <div 
            className="h-full bg-sky-300 transition-all duration-700 ease-out rounded-r-full"
            style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex items-center gap-2 mb-4 mt-4 z-10">
        <div className="p-2 bg-sky-100 rounded-full text-sky-500">
            <Droplets className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-gray-700">ดื่มน้ำจ้า</h3>
      </div>

      {/* Main Display */}
      <div className="text-center mb-6 z-10">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-sky-400">{currentMl}</span>
            <span className="text-gray-400 font-medium">มล.</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            ประมาณ <span className="font-bold text-sky-400 text-lg">{glassesEquivalent}</span> แก้ว
          </p>
      </div>

      {/* Quick Add Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full mb-4 z-10">
        <button 
          onClick={() => onAdd(250)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 active:scale-95 transition border-2 border-transparent hover:border-sky-200 group"
        >
          <GlassWater size={24} className="text-sky-400 mb-1 group-hover:scale-110 transition" />
          <span className="text-sm font-bold text-sky-600">+ แก้ว</span>
          <span className="text-xs text-sky-400">250 ml</span>
        </button>

        <button 
          onClick={() => onAdd(600)}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 active:scale-95 transition border-2 border-transparent hover:border-sky-200 group"
        >
          <div className="relative">
             <Milk size={24} className="text-sky-400 mb-1 group-hover:scale-110 transition" />
          </div>
          <span className="text-sm font-bold text-sky-600">+ ขวด</span>
          <span className="text-xs text-sky-400">600 ml</span>
        </button>
      </div>

      {/* Undo Button */}
      <button 
          onClick={() => onAdd(-250)}
          className="text-xs text-gray-400 hover:text-rose-400 flex items-center gap-1 transition px-3 py-1 rounded-full hover:bg-rose-50 z-10"
          disabled={currentMl <= 0}
      >
        <Minus size={12} /> กดผิดหรอ? ลดหน่อย
      </button>
    </div>
  );
};

export default WaterTracker;