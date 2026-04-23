import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== USERS ====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  age: integer("age"),
  height: decimal("height", { precision: 5, scale: 2 }), // cm
  weight: decimal("weight", { precision: 10, scale: 2 }), // kg
  bloodType: text("blood_type"), // O, A, B, AB
  activityLevel: text("activity_level"), // sedentary, light, moderate, active
  goals: jsonb("goals"), // string[] of goal IDs
  onboardingCompleted: boolean("onboarding_completed").default(false),
  isAdmin: boolean("is_admin").default(false),
  role: text("role").notNull().default("patient"), // admin, doctor, coach, patient
  clientId: text("client_id"), // human-friendly patient/client identifier
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== MEALS ====================
export const meals = pgTable("meals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== NUTRIENTS ====================
export const nutrients = pgTable("nutrients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mealId: varchar("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  calories: decimal("calories", { precision: 10, scale: 2 }).notNull(),
  protein: decimal("protein", { precision: 10, scale: 2 }), // grams
  carbohydrates: decimal("carbohydrates", { precision: 10, scale: 2 }), // grams
  fat: decimal("fat", { precision: 10, scale: 2 }), // grams
  fiber: decimal("fiber", { precision: 10, scale: 2 }), // grams
  sugar: decimal("sugar", { precision: 10, scale: 2 }), // grams
  sodium: decimal("sodium", { precision: 10, scale: 2 }), // mg
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== HEALTH METRICS ====================
export const healthMetrics = pgTable("health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  weight: decimal("weight", { precision: 10, scale: 2 }), // kg
  height: decimal("height", { precision: 10, scale: 2 }), // cm
  bmi: decimal("bmi", { precision: 5, scale: 2 }),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  heartRate: integer("heart_rate"), // bpm
  glucose: decimal("glucose", { precision: 10, scale: 2 }), // mg/dL
  sleepHours: decimal("sleep_hours", { precision: 5, scale: 2 }),
  waterIntake: decimal("water_intake", { precision: 10, scale: 2 }), // ml
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== MEDICATIONS ====================
export const medications = pgTable("medications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dosage: text("dosage").notNull(),
  unit: text("unit"), // mg, ml, tablet, etc
  frequency: text("frequency").notNull(), // once daily, twice daily, etc
  reason: text("reason"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  prescribedBy: text("prescribed_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== HEALTH JOURNAL ====================
export const healthJournal = pgTable("health_journal", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  mood: text("mood"), // happy, sad, neutral, anxious, stressed
  energy: integer("energy"), // 1-10 scale
  tags: text("tags").array(), // symptom, note, reminder
  attachments: jsonb("attachments"), // file paths/URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== DIETARY PREFERENCES ====================
export const dietaryPreferences = pgTable("dietary_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  vegetarian: boolean("vegetarian").default(false),
  vegan: boolean("vegan").default(false),
  glutenFree: boolean("gluten_free").default(false),
  dairyFree: boolean("dairy_free").default(false),
  nutAllergy: boolean("nut_allergy").default(false),
  shellFishAllergy: boolean("shellfish_allergy").default(false),
  otherAllergies: text("other_allergies"),
  dietType: text("diet_type"), // balanced, keto, low-carb, mediterranean
  calorieGoal: integer("calorie_goal"),
  proteinGoal: decimal("protein_goal", { precision: 10, scale: 2 }),
  carbGoal: decimal("carb_goal", { precision: 10, scale: 2 }),
  fatGoal: decimal("fat_goal", { precision: 10, scale: 2 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== CHATBOT MESSAGES ====================
export const chatbotMessages = pgTable("chatbot_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id").notNull(), // Group messages by conversation
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // text, suggestion, recommendation
  metadata: jsonb("metadata"), // Store additional data like nutrition advice, health tips
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== USER GOALS ====================
export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalType: text("goal_type").notNull(), // lose_weight, gain_muscle, maintain, etc.
  targetWeight: decimal("target_weight", { precision: 10, scale: 2 }),
  startWeight: decimal("start_weight", { precision: 10, scale: 2 }),
  targetDate: timestamp("target_date"),
  targetCalories: integer("target_calories"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== EMERGENCY CONTACTS ====================
export const emergencyContacts = pgTable("emergency_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  countryCode: text("country_code").default("+966"),
  relationship: text("relationship"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const emergencyMedicalInfo = pgTable("emergency_medical_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  medications: text("medications"),
  conditions: text("conditions"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== RELATIONS ====================
export const mealsRelations = relations(meals, ({ many }) => ({
  nutrients: many(nutrients),
}));

export const nutrientsRelations = relations(nutrients, ({ one }) => ({
  meal: one(meals, { fields: [nutrients.mealId], references: [meals.id] }),
}));

// ==================== ZOD VALIDATION SCHEMAS ====================
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  age: true,
  height: true,
  weight: true,
  bloodType: true,
  role: true,
  clientId: true,
});

export const insertMealSchema = createInsertSchema(meals).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNutrientSchema = createInsertSchema(nutrients).omit({
  id: true,
  mealId: true,
  createdAt: true,
});

export const insertHealthMetricSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthJournalSchema = createInsertSchema(healthJournal).omit(
  {
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
  }
);

export const insertDietaryPreferencesSchema = createInsertSchema(
  dietaryPreferences
).omit({
  id: true,
  userId: true,
  updatedAt: true,
});

export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages).omit(
  {
    id: true,
    userId: true,
    createdAt: true,
  }
);

export const insertUserGoalSchema = createInsertSchema(userGoals).omit({
  id: true, userId: true, createdAt: true, updatedAt: true,
});

export const insertEmergencyContactSchema = createInsertSchema(emergencyContacts).omit({
  id: true, userId: true, createdAt: true,
});

export const insertEmergencyMedicalInfoSchema = createInsertSchema(emergencyMedicalInfo).omit({
  id: true, userId: true, updatedAt: true,
});

// ==================== TYPE EXPORTS ====================
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

export type Nutrient = typeof nutrients.$inferSelect;
export type InsertNutrient = z.infer<typeof insertNutrientSchema>;

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type HealthJournalEntry = typeof healthJournal.$inferSelect;
export type InsertHealthJournalEntry = z.infer<
  typeof insertHealthJournalSchema
>;

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;

export type DietaryPreferences = typeof dietaryPreferences.$inferSelect;
export type InsertDietaryPreferences = z.infer<
  typeof insertDietaryPreferencesSchema
>;

export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = z.infer<typeof insertChatbotMessageSchema>;

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type InsertEmergencyContact = z.infer<typeof insertEmergencyContactSchema>;

export type EmergencyMedicalInfo = typeof emergencyMedicalInfo.$inferSelect;
export type InsertEmergencyMedicalInfo = z.infer<typeof insertEmergencyMedicalInfoSchema>;
