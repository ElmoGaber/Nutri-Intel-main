/**
 * File-based persistence for mock mode (no DATABASE_URL).
 * All data is stored in server/data/mock-store.json and survives server restarts.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import {
  createDefaultSystemControlConfig,
  type SystemControlConfig,
} from "../shared/system-control-config";

const DATA_DIR = join(process.cwd(), "server", "data");
const DB_FILE = join(join(DATA_DIR, "mock-store.json"));

type MockDate = string | Date;

// ── Types ────────────────────────────────────────────────────────────────────

export type MockUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  height?: number;
  weight?: number;
  bloodType?: string;
  activityLevel?: string;
  goals?: string[];
  isAdmin?: boolean;
  role?: "admin" | "doctor" | "coach" | "patient";
  clientId?: string;
  onboardingCompleted?: boolean;
  createdAt: MockDate;
  updatedAt: MockDate;
};

export type MockMedication = {
  id: string; userId: string; name: string; dosage: string; unit?: string;
  frequency: string; reason?: string; time?: string; relation?: string;
  status?: string; warning?: string; startDate: MockDate; endDate?: MockDate;
  prescribedBy?: string; notes?: string; createdAt: MockDate; updatedAt: MockDate;
};

export type MockMeal = {
  id: string; userId: string; name: string; mealType: string;
  description?: string | null; calories?: number; protein?: number;
  carbs?: number; fat?: number; date: MockDate; createdAt: MockDate; updatedAt: MockDate;
};

export type MockHealthMetric = {
  id: string; userId: string; type: string; value: string; unit?: string;
  date: MockDate; notes?: string; createdAt: MockDate; updatedAt: MockDate;
};

export type MockJournalEntry = {
  id: string; userId: string; title?: string; content: string; mood?: string;
  symptoms?: string; tags?: string; date: MockDate; createdAt: MockDate; updatedAt: MockDate;
};

export type MockChatMessage = {
  id: string; userId: string; conversationId: string; role: string;
  content: string; messageType: string; metadata?: any; createdAt: MockDate;
};

export type MockDietaryPreference = {
  id: string; userId: string; dietType?: string; calorieGoal?: number;
  vegetarian?: boolean; vegan?: boolean; glutenFree?: boolean;
  dairyFree?: boolean; nutAllergy?: boolean; shellFishAllergy?: boolean;
  otherAllergies?: string; proteinGoal?: number; carbGoal?: number; fatGoal?: number;
  allergies?: string; updatedAt: MockDate;
};

export type MockUpload = {
  id: string; filename: string; mimetype: string; data: string; url: string; createdAt: MockDate;
};

export type MockCoachingSession = {
  id: string; userId: string; title: string; notes?: string;
  coachUserId?: string;
  meetingUrl?: string;
  scheduledAt?: MockDate; status: string; createdAt: MockDate; updatedAt: MockDate;
};

export type MockWaterLog = {
  id: string; userId: string; amount: number; unit: string; date: MockDate; createdAt: MockDate;
};

export type MockUserGoal = {
  id: string; userId: string; goalType: string; targetWeight?: number;
  startWeight?: number; targetDate?: MockDate; targetCalories?: number;
  isActive: boolean; createdAt: MockDate; updatedAt: MockDate;
};

export type MockEmergencyContact = {
  id: string; userId: string; name: string; phone: string;
  countryCode: string; relationship?: string; isPrimary: boolean; createdAt: MockDate;
};

export type MockAdminMessage = {
  id: string;
  toUserId: string;
  fromAdminId: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: MockDate;
};

export type MockClientPersonalization = {
  userId: string;
  updatedAt: MockDate;
  profile: {
    dietType: string;
    allergies: string[];
    conditions: string[];
    favoriteFoodsAdult: string[];
    favoriteFoodsKids: string[];
    avoidFoods: string[];
    disabledFoodNames: string[];
    preferredReadyMealTags: string[];
    kidFriendlyFocus: boolean;
    emergencyAdviceEn: string;
    emergencyAdviceAr: string;
  };
  formulas: {
    enabledFormulaKeys: Array<"mifflin_abw" | "katch_lbm" | "clinical_conservative" | "abw_ter_30">;
    activeFormulaKey: "mifflin_abw" | "katch_lbm" | "clinical_conservative" | "abw_ter_30";
    showEquationSteps: boolean;
  };
};

// ── Store shape ───────────────────────────────────────────────────────────────

type StoreData = {
  users: MockUser[];
  medications: MockMedication[];
  meals: MockMeal[];
  healthMetrics: MockHealthMetric[];
  journalEntries: MockJournalEntry[];
  chatMessages: MockChatMessage[];
  dietaryPreferences: MockDietaryPreference[];
  uploads: MockUpload[];
  coachingSessions: MockCoachingSession[];
  waterLogs: MockWaterLog[];
  userGoals: MockUserGoal[];
  emergencyContacts: MockEmergencyContact[];
  emergencyMedicalInfo: Record<string, Record<string, string>>;
  adminMessages: MockAdminMessage[];
  clientPersonalizations: MockClientPersonalization[];
  systemControlConfig: SystemControlConfig;
};

const EMPTY: StoreData = {
  users: [], medications: [], meals: [], healthMetrics: [],
  journalEntries: [], chatMessages: [], dietaryPreferences: [],
  uploads: [], coachingSessions: [], waterLogs: [], userGoals: [],
  emergencyContacts: [], emergencyMedicalInfo: {}, adminMessages: [],
  clientPersonalizations: [],
  systemControlConfig: createDefaultSystemControlConfig(),
};

// ── Maps (runtime) ────────────────────────────────────────────────────────────

export const mockUsers            = new Map<string, MockUser>();
export const mockMedications      = new Map<string, MockMedication>();
export const mockMeals            = new Map<string, MockMeal>();
export const mockHealthMetrics    = new Map<string, MockHealthMetric>();
export const mockJournalEntries   = new Map<string, MockJournalEntry>();
export const mockChatMessages     = new Map<string, MockChatMessage>();
export const mockDietaryPrefs     = new Map<string, MockDietaryPreference>();
export const mockUploads          = new Map<string, MockUpload>();
export const mockCoachingSessions = new Map<string, MockCoachingSession>();
export const mockWaterLogs        = new Map<string, MockWaterLog>();
export const mockUserGoals        = new Map<string, MockUserGoal>();
export const mockEmergencyContacts= new Map<string, MockEmergencyContact>();
export const mockEmergencyMedInfo = new Map<string, Record<string, string>>();
export const mockAdminMessages    = new Map<string, MockAdminMessage>();
export const mockClientPersonalizations = new Map<string, MockClientPersonalization>();
export let mockSystemControlConfig: SystemControlConfig = createDefaultSystemControlConfig();

export function setMockSystemControlConfig(config: SystemControlConfig) {
  mockSystemControlConfig = config;
}

// ── Load ──────────────────────────────────────────────────────────────────────

function loadFromFile(): StoreData {
  try {
    if (!existsSync(DB_FILE)) return { ...EMPTY };
    const raw = readFileSync(DB_FILE, "utf-8");
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

export function loadStore() {
  const data = loadFromFile();

  data.users.forEach((u)            => mockUsers.set(u.id, u));
  data.medications.forEach((m)      => mockMedications.set(m.id, m));
  data.meals.forEach((m)            => mockMeals.set(m.id, m));
  data.healthMetrics.forEach((m)    => mockHealthMetrics.set(m.id, m));
  data.journalEntries.forEach((e)   => mockJournalEntries.set(e.id, e));
  data.chatMessages.forEach((m)     => mockChatMessages.set(m.id, m));
  data.dietaryPreferences.forEach((p) => mockDietaryPrefs.set(p.id, p));
  data.uploads.forEach((u)          => mockUploads.set(u.id, u));
  data.coachingSessions.forEach((s) => mockCoachingSessions.set(s.id, s));
  data.waterLogs.forEach((w)        => mockWaterLogs.set(w.id, w));
  data.userGoals.forEach((g)        => mockUserGoals.set(g.id, g));
  data.emergencyContacts.forEach((c) => mockEmergencyContacts.set(c.id, c));
  Object.entries(data.emergencyMedicalInfo).forEach(([k, v]) => mockEmergencyMedInfo.set(k, v));
  (data.adminMessages || []).forEach((m) => mockAdminMessages.set(m.id, m));
  (data.clientPersonalizations || []).forEach((settings) => mockClientPersonalizations.set(settings.userId, settings));
  mockSystemControlConfig = data.systemControlConfig || createDefaultSystemControlConfig();

  console.log(`[mock-db] Loaded: ${mockUsers.size} users, ${mockMeals.size} meals, ${mockHealthMetrics.size} metrics`);
}

// ── Save ──────────────────────────────────────────────────────────────────────

export function saveStore() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    const data: StoreData = {
      users:               Array.from(mockUsers.values()),
      medications:         Array.from(mockMedications.values()),
      meals:               Array.from(mockMeals.values()),
      healthMetrics:       Array.from(mockHealthMetrics.values()),
      journalEntries:      Array.from(mockJournalEntries.values()),
      chatMessages:        Array.from(mockChatMessages.values()),
      dietaryPreferences:  Array.from(mockDietaryPrefs.values()),
      uploads:             Array.from(mockUploads.values()),
      coachingSessions:    Array.from(mockCoachingSessions.values()),
      waterLogs:           Array.from(mockWaterLogs.values()),
      userGoals:           Array.from(mockUserGoals.values()),
      emergencyContacts:   Array.from(mockEmergencyContacts.values()),
      emergencyMedicalInfo: Object.fromEntries(mockEmergencyMedInfo.entries()),
      adminMessages:        Array.from(mockAdminMessages.values()),
      clientPersonalizations: Array.from(mockClientPersonalizations.values()),
      systemControlConfig: mockSystemControlConfig,
    };
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("[mock-db] Save failed:", e);
  }
}

// Auto-save every 10 seconds
let _saveTimer: ReturnType<typeof setInterval> | null = null;
export function startAutoSave() {
  if (_saveTimer) return;
  _saveTimer = setInterval(saveStore, 10_000);
  process.on("exit", saveStore);
  process.on("SIGINT", () => { saveStore(); process.exit(); });
  process.on("SIGTERM", () => { saveStore(); process.exit(); });
}
