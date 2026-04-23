import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Plus, X, Search, Loader2, Camera, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect, useMemo } from "react";
import { downloadPDF } from "@/lib/actions";
import { useMeals, useCreateMeal, useDeleteMeal, useUpdateMeal } from "@/hooks/useNutrition";
import { useNutritionGoals } from "@/hooks/useNutritionGoals";
import { searchFoods, foodDatabase } from "../../../shared/food-nutrition";
import { dateFromLocalDateString, toLocalDateString } from "@/lib/dateUtils";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const arDaysOfWeek = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];

function getDateForDay(dayName: string): string {
  const current = new Date();
  const currentDayIndex = (current.getDay() + 6) % 7;
  const targetDayIndex = daysOfWeek.indexOf(dayName);
  const diff = targetDayIndex - currentDayIndex;
  const target = new Date(current);
  target.setDate(current.getDate() + diff);
  return toLocalDateString(target);
}

function getTodayDayName(): string {
  return daysOfWeek[(new Date().getDay() + 6) % 7];
}

type MealSuggestion = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  uses: number;
};

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

type MealForm = {
  name: string;
  time: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  type: MealType;
};

const emptyMealForm: MealForm = {
  name: "",
  time: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  type: "other",
};

const foodNameToAr = new Map(foodDatabase.map((food) => [food.name.toLowerCase(), food.nameAr]));
const foodNameToEn = new Map(foodDatabase.map((food) => [food.nameAr, food.name]));

function normalizeMealType(type: string | null | undefined): MealType {
  const normalized = String(type || "other").toLowerCase();
  if (normalized === "snacks") return "snack";
  if (normalized === "breakfast" || normalized === "lunch" || normalized === "dinner" || normalized === "snack" || normalized === "other") {
    return normalized;
  }
  return "other";
}

function mealTypeLabel(type: string | null | undefined, language: string, t: (key: any) => string): string {
  const normalized = normalizeMealType(type);
  if (normalized === "snack") return t("snacks");
  if (normalized === "other") return language === "ar" ? "أخرى" : "Other";
  return t(normalized as any);
}

function localizeMealName(name: string | null | undefined, language: string): string {
  const raw = String(name || "").trim();
  if (!raw) return raw;

  if (language === "ar") {
    return foodNameToAr.get(raw.toLowerCase()) || raw;
  }

  return foodNameToEn.get(raw) || raw;
}

export default function MealPlanner() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState(getTodayDayName);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [mealForm, setMealForm] = useState<MealForm>(emptyMealForm);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodResults, setFoodResults] = useState<ReturnType<typeof searchFoods>>([]);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const addFormRef = useRef<HTMLDivElement>(null);

  const selectedDate = getDateForDay(selectedDay);
  const { data: meals = [], isLoading } = useMeals(selectedDate);
  const { goals } = useNutritionGoals();
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();

  const totalCalories = meals.reduce((sum, meal) => sum + Number((meal as any).calories || 0), 0);
  const calorieProgress = goals.calories > 0 ? Math.min((totalCalories / goals.calories) * 100, 100) : 0;
  const personalizedSuggestions = useMemo(() => {
    const byMealName = new Map<string, MealSuggestion>();

    for (const meal of meals as any[]) {
      const key = String(meal?.name || "").trim().toLowerCase();
      if (!key) continue;
      const existing = byMealName.get(key);
      if (existing) {
        existing.uses += 1;
        continue;
      }

      byMealName.set(key, {
        name: String(meal.name || "").trim(),
        calories: Number(meal.calories) || 0,
        protein: Number(meal.protein) || 0,
        carbs: Number(meal.carbs) || 0,
        fat: Number(meal.fat) || 0,
        uses: 1,
      });
    }

    return Array.from(byMealName.values())
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 8);
  }, [meals]);

  useEffect(() => {
    if (showAddForm && addFormRef.current) {
      addFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAddForm]);

  useEffect(() => {
    if (foodSearch.trim().length >= 2) {
      setFoodResults(searchFoods(foodSearch).slice(0, 6));
    } else {
      setFoodResults([]);
    }
  }, [foodSearch]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "1") {
      setShowAddForm(true);
    }
  }, []);

  const resetForm = () => {
    setMealForm(emptyMealForm);
    setEditingMealId(null);
    setFoodSearch("");
    setFoodResults([]);
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const closeForm = () => {
    setShowAddForm(false);
    resetForm();
  };

  const fillFromFood = (food: ReturnType<typeof searchFoods>[number]) => {
    const g = 100;
    setMealForm({
      name: language === "ar" ? food.nameAr : food.name,
      time: mealForm.time,
      calories: Math.round((food.per100g.caloricValue * g) / 100).toString(),
      protein: Math.round(((food.per100g.protein ?? 0) * g) / 100).toString(),
      carbs: Math.round(((food.per100g.carbohydrates ?? 0) * g) / 100).toString(),
      fat: Math.round(((food.per100g.fat ?? 0) * g) / 100).toString(),
      type: mealForm.type,
    });
    setFoodSearch("");
    setFoodResults([]);
  };

  const handlePhotoAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzingPhoto(true);

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/analyze-meal-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type, language }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setMealForm((current) => ({
        ...current,
        name: data.name || current.name,
        calories: data.calories ? String(data.calories) : current.calories,
        protein: data.protein ? String(data.protein) : current.protein,
        carbs: data.carbs ? String(data.carbs) : current.carbs,
        fat: data.fat ? String(data.fat) : current.fat,
      }));

      toast({
        title: language === "ar" ? "تم التحليل" : "Analysis complete",
        description: language === "ar" ? "راجع القيم وعدلها إذا لزم" : "Review the values and adjust if needed",
      });
    } catch {
      toast({
        title: language === "ar" ? "فشل التحليل" : "Analysis failed",
        description: language === "ar" ? "أدخل البيانات يدويًا" : "Please enter the meal details manually",
      });
    } finally {
      setAnalyzingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const buildMealPayload = () => ({
    name: mealForm.name.trim(),
    description: mealForm.time || null,
    mealType: mealForm.type === "snack" ? "snacks" : mealForm.type,
    date: dateFromLocalDateString(selectedDate),
    calories: Number(mealForm.calories),
    protein: mealForm.protein ? Number(mealForm.protein) : undefined,
    carbs: mealForm.carbs ? Number(mealForm.carbs) : undefined,
    fat: mealForm.fat ? Number(mealForm.fat) : undefined,
  });

  const submitMeal = async () => {
    if (!mealForm.name.trim() || !mealForm.calories) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى إدخال اسم الوجبة والسعرات" : "Please enter the meal name and calories",
      });
      return;
    }

    const payload = buildMealPayload();

    if (editingMealId) {
      await updateMeal.mutateAsync({ id: editingMealId, meal: payload as any });
      toast({
        title: language === "ar" ? "تم التعديل" : "Updated",
        description: language === "ar" ? "تم تحديث الوجبة بنجاح" : "Meal updated successfully",
      });
    } else {
      await createMeal.mutateAsync(payload as any);
      toast({
        title: language === "ar" ? "تمت الإضافة" : "Added",
        description: language === "ar" ? "تمت إضافة الوجبة بنجاح" : "Meal added successfully",
      });
    }

    closeForm();
  };

  const addSuggestion = async (recipe: MealSuggestion) => {
    await createMeal.mutateAsync({
      name: recipe.name,
      description: null,
      mealType: "other",
      date: dateFromLocalDateString(selectedDate),
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    } as any);

    toast({
      title: language === "ar" ? "تمت الإضافة" : "Added",
      description: language === "ar" ? `تمت إضافة ${localizeMealName(recipe.name, language)}` : `${localizeMealName(recipe.name, language)} added successfully`,
    });
  };

  const startEditMeal = (meal: any) => {
    setEditingMealId(meal.id);
    setMealForm({
      name: localizeMealName(meal.name, language),
      time: meal.description || "",
      calories: meal.calories != null ? String(meal.calories) : "",
      protein: meal.protein != null ? String(meal.protein) : "",
      carbs: meal.carbs != null ? String(meal.carbs) : "",
      fat: meal.fat != null ? String(meal.fat) : "",
      type: normalizeMealType(meal.mealType),
    });
    setShowAddForm(true);
  };

  const removeMeal = (id: string) => {
    deleteMeal.mutate({ id, dateKey: selectedDate });
  };

  const handleDownload = () => {
    const sections = daysOfWeek.map((day, idx) => {
      const date = getDateForDay(day);
      return {
        heading: language === "ar" ? arDaysOfWeek[idx] : day,
        content: `${language === "ar" ? "التاريخ" : "Date"}: ${date}`,
      };
    });

    downloadPDF("meal-plan.pdf", language === "ar" ? "خطة الوجبات الأسبوعية" : "Weekly Meal Plan", sections);
    toast({
      title: language === "ar" ? "تم التنزيل" : "Downloaded",
      description: language === "ar" ? "تم تنزيل خطة الوجبات" : "Meal plan downloaded successfully",
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gradient">{t("mealPlannerTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("weeklyPlan")}</p>
      </div>

      <div className="glass-card p-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {daysOfWeek.map((day, idx) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap font-medium ${selectedDay === day ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {language === "ar" ? arDaysOfWeek[idx] : day}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{language === "ar" ? arDaysOfWeek[daysOfWeek.indexOf(selectedDay)] : selectedDay}</h2>
            <p className="text-xs text-muted-foreground">{selectedDate}</p>
          </div>
          <div className="text-end">
            <p className="text-sm text-muted-foreground">{t("totalCalories")}</p>
            <p className="text-2xl font-bold text-primary">{totalCalories}</p>
          </div>
        </div>
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${calorieProgress}%` }} />
        </div>
      </div>

      {showAddForm && (
        <div ref={addFormRef} className="glass-card p-6 border-s-4 border-blue-500 bg-blue-500/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{editingMealId ? (language === "ar" ? "تعديل وجبة" : "Edit Meal") : language === "ar" ? "إضافة وجبة" : "Add Meal"}</h2>
            <button onClick={closeForm} className="p-1 hover:bg-white/10 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={language === "ar" ? "ابحث في قاعدة بيانات الأطعمة..." : "Search food database..."}
                value={foodSearch}
                onChange={(e) => setFoodSearch(e.target.value)}
              />
            </div>
            {foodResults.length > 0 && (
              <div className="mt-1 border rounded-lg bg-background shadow-lg overflow-hidden z-10">
                {foodResults.map((food, i) => (
                  <button
                    key={i}
                    className="w-full px-3 py-2 text-start hover:bg-muted transition-colors flex justify-between items-center text-sm"
                    onClick={() => fillFromFood(food)}
                  >
                    <span>{language === "ar" ? food.nameAr : food.name}</span>
                    <span className="text-muted-foreground text-xs">{food.per100g.caloricValue} kcal/100g</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoAnalyze} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-dashed gap-2"
              onClick={() => photoInputRef.current?.click()}
              disabled={analyzingPhoto}
            >
              {analyzingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {analyzingPhoto
                ? language === "ar"
                  ? "جارٍ التحليل..."
                  : "Analyzing..."
                : language === "ar"
                  ? "صوّر وجبتك وسيحللها الذكاء الاصطناعي"
                  : "Take a meal photo and AI will analyze it"}
            </Button>
          </div>

          <div className="space-y-3">
            <Input placeholder={language === "ar" ? "اسم الوجبة" : "Meal name"} value={mealForm.name} onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={mealForm.time} onChange={(e) => setMealForm({ ...mealForm, time: e.target.value })} />
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={mealForm.type}
                onChange={(e) => setMealForm({ ...mealForm, type: e.target.value as MealType })}
              >
                <option value="breakfast">{language === "ar" ? "فطار" : "Breakfast"}</option>
                <option value="lunch">{language === "ar" ? "غداء" : "Lunch"}</option>
                <option value="dinner">{language === "ar" ? "عشاء" : "Dinner"}</option>
                <option value="snack">{language === "ar" ? "سناك" : "Snack"}</option>
                <option value="other">{language === "ar" ? "أخرى" : "Other"}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder={language === "ar" ? "السعرات *" : "Calories *"} value={mealForm.calories} onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} />
              <Input type="number" placeholder={language === "ar" ? "بروتين (g)" : "Protein (g)"} value={mealForm.protein} onChange={(e) => setMealForm({ ...mealForm, protein: e.target.value })} />
              <Input type="number" placeholder={language === "ar" ? "كارب (g)" : "Carbs (g)"} value={mealForm.carbs} onChange={(e) => setMealForm({ ...mealForm, carbs: e.target.value })} />
              <Input type="number" placeholder={language === "ar" ? "دهون (g)" : "Fat (g)"} value={mealForm.fat} onChange={(e) => setMealForm({ ...mealForm, fat: e.target.value })} />
            </div>
            <Button className="w-full" onClick={submitMeal} disabled={createMeal.isPending || updateMeal.isPending}>
              {createMeal.isPending || updateMeal.isPending ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}
              {editingMealId ? (language === "ar" ? "حفظ التعديلات" : "Save changes") : language === "ar" ? "إضافة الوجبة" : "Add Meal"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="glass-card p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : meals.length > 0 ? (
          meals.map((meal: any) => (
            <div key={meal.id} className="glass-card p-4 flex items-center justify-between group hover:bg-white/30 dark:hover:bg-white/10 transition-all">
              <div>
                <h3 className="font-medium mb-1">{localizeMealName(meal.name, language)}</h3>
                {meal.description && <p className="text-sm text-muted-foreground">{meal.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "ar" ? "النوع" : "Type"}: {mealTypeLabel(meal.mealType, language, t)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-end">
                  <p className="font-bold text-primary">{Number(meal.calories || 0)}</p>
                  <p className="text-xs text-muted-foreground">kcal</p>
                </div>
                <button onClick={() => startEditMeal(meal)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => removeMeal(meal.id)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-8 text-center">
            <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{language === "ar" ? "لا توجد وجبات لهذا اليوم" : "No meals planned for this day"}</p>
            <p className="text-xs text-muted-foreground mt-1">{language === "ar" ? "أضف وجبة أو اختر من المقترحات أدناه" : "Add a meal or pick one of the suggestions below"}</p>
          </div>
        )}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4">{language === "ar" ? "اقتراحات من بياناتك" : "Suggestions From Your Data"}</h2>
        {personalizedSuggestions.length > 0 ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {personalizedSuggestions.map((recipe, idx) => (
              <div
                key={`${recipe.name}-${idx}`}
                className="p-3 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors cursor-pointer"
                onClick={() => addSuggestion(recipe)}
              >
                <div>
                  <p className="font-medium text-sm">{localizeMealName(recipe.name, language)}</p>
                  <p className="text-xs text-muted-foreground">{recipe.calories} kcal</p>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {language === "ar"
              ? "لا توجد اقتراحات مخصصة بعد. أضف وجباتك أولاً ليتم توليد اقتراحات من بياناتك الفعلية."
              : "No personalized suggestions yet. Add your meals first to generate suggestions from your actual data."}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button className="flex-1" onClick={openAddForm}>
          <Plus className="w-4 h-4 me-2" />
          {t("addMealButton")}
        </Button>
        <Button variant="outline" className="flex-1" onClick={handleDownload}>
          {t("download")}
        </Button>
      </div>
    </div>
  );
}
