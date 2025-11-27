export enum Gender {
  MALE = 'ชาย',
  FEMALE = 'หญิง'
}

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  activityLevel: number; // BMR multiplier (will default to sedentary 1.2)
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface DailyLog {
  date: string;
  foods: FoodItem[];
  waterIntake: number; // milliliters (ml)
}

export interface MealSuggestion {
  mealName: string;
  description: string;
  calories: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface WeightPrediction {
  days: number;
  dailyDeficit: number;
  projectedDate: string;
  graphData: { day: number; weight: number }[];
}