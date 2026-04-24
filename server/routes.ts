import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "./db";
import {
  generateResetToken,
  consumeResetToken,
  sendPasswordResetEmail,
  getLastPreviewUrl,
} from "./email";
import {
  users,
  meals,
  nutrients,
  healthMetrics,
  medications,
  healthJournal,
  dietaryPreferences,
  chatbotMessages,
  userGoals,
  emergencyContacts,
  emergencyMedicalInfo,
  insertUserSchema,
  insertMealSchema,
  insertHealthMetricSchema,
  insertMedicationSchema,
  insertHealthJournalSchema,
  insertDietaryPreferencesSchema,
  insertChatbotMessageSchema,
  insertUserGoalSchema,
  insertEmergencyContactSchema,
  insertEmergencyMedicalInfoSchema,
} from "@shared/schema";
import {
  hashPassword,
  comparePassword,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateUser,
  createUser,
  getAllUsers,
  isValidEmail,
  validatePasswordStrength,
  isMockMode,
  type UserRole,
} from "./auth";
import {
  loadStore,
  saveStore,
  startAutoSave,
  mockMedications,
  mockMeals,
  mockHealthMetrics,
  mockJournalEntries,
  mockChatMessages,
  mockDietaryPrefs,
  mockUploads,
  mockCoachingSessions,
  mockWaterLogs,
  mockUserGoals,
  mockEmergencyContacts,
  mockEmergencyMedInfo,
  mockAdminMessages,
  mockClientPersonalizations,
  mockSystemControlConfig,
  setMockSystemControlConfig,
  type MockMedication,
  type MockMeal,
  type MockHealthMetric,
  type MockJournalEntry,
  type MockChatMessage,
  type MockDietaryPreference,
  type MockUpload,
  type MockCoachingSession,
  type MockWaterLog,
  type MockUserGoal,
  type MockEmergencyContact,
  type MockAdminMessage,
  type MockClientPersonalization,
} from "./mock-persist";
import {
  foodDatabase,
  foodCategories,
  searchFoods,
  calculateNutrition,
} from "../shared/food-nutrition";
import {
  DEFAULT_CLIENT_FORMULA_ASSIGNMENT,
  NUTRITION_FORMULA_PRESETS,
  createDefaultClientPersonalizationSettings,
  normalizeStringList,
  splitCsvList,
  type ClientPersonalizationSettings,
  type NutritionFormulaKey,
} from "../shared/personalization-config";
import {
  createDefaultSystemControlConfig,
  mergeSystemControlConfig,
  type SystemControlConfig,
  type SystemRoleKey,
} from "../shared/system-control-config";

// Type assertion helper for session
const sessionUserId = (req: Request): string | undefined => {
  return (req.session as any).userId;
};

const setSessionUserId = (req: Request, userId: string) => {
  (req.session as any).userId = userId;
};

function normalizeRole(input: unknown, fallback: UserRole = "patient"): UserRole {
  const value = typeof input === "string" ? input.trim().toLowerCase() : "";
  if (value === "admin" || value === "doctor" || value === "coach" || value === "patient") {
    return value;
  }
  return fallback;
}

function getUserRole(user: any): UserRole {
  if (!user) return "patient";
  if (user.isAdmin) return "admin";
  return normalizeRole(user.role, "patient");
}

function generateGoogleMeetUrl(): string {
  const a = Math.random().toString(36).slice(2, 5);
  const b = Math.random().toString(36).slice(2, 6);
  const c = Math.random().toString(36).slice(2, 5);
  return `https://meet.google.com/${a}-${b}-${c}`;
}

function getDateRangeFromQuery(date: unknown): { startOfDay: Date; endOfDay: Date } {
  const raw = typeof date === "string" ? date : "";
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const dateObj = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date();
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  return { startOfDay, endOfDay };
}

function parseOptionalIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function getRouteParam(req: Request, name: string): string | undefined {
  const raw = req.params?.[name];
  if (typeof raw === "string") return raw;
  return Array.isArray(raw) ? raw[0] : undefined;
}

// Helper to generate IDs
function mockId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// Alias for old name used in emergency routes
const mockEmergencyMedicalInfo = mockEmergencyMedInfo;
const mockDietaryPreferences = mockDietaryPrefs;

const runtimeClientPersonalizations = new Map<string, ClientPersonalizationSettings>();
let runtimeSystemControlConfig: SystemControlConfig = createDefaultSystemControlConfig();

function getSystemControlConfig(): SystemControlConfig {
  return isMockMode ? mockSystemControlConfig : runtimeSystemControlConfig;
}

function saveSystemControlConfig(config: SystemControlConfig): SystemControlConfig {
  if (isMockMode) {
    setMockSystemControlConfig(config);
    saveStore();
    return config;
  }
  runtimeSystemControlConfig = config;
  return runtimeSystemControlConfig;
}

function normalizeSystemRole(role: UserRole): SystemRoleKey {
  if (role === "admin" || role === "doctor" || role === "coach" || role === "patient") {
    return role;
  }
  return "patient";
}

function hasRoleCapability(role: UserRole, capability: keyof SystemControlConfig["roleCapabilities"]["admin"]): boolean {
  const config = getSystemControlConfig();
  const normalized = normalizeSystemRole(role);
  return Boolean(config.roleCapabilities?.[normalized]?.[capability]);
}

function normalizeListInput(value: unknown): string[] {
  if (typeof value === "string") {
    return splitCsvList(value);
  }
  return normalizeStringList(value);
}

function normalizeFormulaKey(value: unknown): NutritionFormulaKey | null {
  if (typeof value !== "string") return null;
  if (value === "mifflin_abw" || value === "katch_lbm" || value === "clinical_conservative" || value === "abw_ter_30") {
    return value;
  }
  return null;
}

function normalizeFormulaKeys(values: unknown): NutritionFormulaKey[] {
  if (!Array.isArray(values)) return [];
  const keys: NutritionFormulaKey[] = [];
  for (const value of values) {
    const normalized = normalizeFormulaKey(value);
    if (normalized && !keys.includes(normalized)) {
      keys.push(normalized);
    }
  }
  return keys;
}

function getPersonalizationStore() {
  return isMockMode
    ? (mockClientPersonalizations as unknown as Map<string, ClientPersonalizationSettings>)
    : runtimeClientPersonalizations;
}

function getOrCreateClientPersonalizationSettings(userId: string): ClientPersonalizationSettings {
  const store = getPersonalizationStore();
  const existing = store.get(userId);
  if (existing) return existing;

  const created = createDefaultClientPersonalizationSettings(userId);
  store.set(userId, created);
  if (isMockMode) {
    saveStore();
  }
  return created;
}

function mergeClientPersonalizationSettings(
  userId: string,
  payload: unknown,
): ClientPersonalizationSettings {
  const current = getOrCreateClientPersonalizationSettings(userId);
  const incoming = (payload || {}) as Partial<ClientPersonalizationSettings>;
  const incomingProfile = (incoming.profile || {}) as Partial<ClientPersonalizationSettings["profile"]>;
  const incomingFormulas = (incoming.formulas || {}) as Partial<ClientPersonalizationSettings["formulas"]>;

  const enabledFormulaKeys = normalizeFormulaKeys(incomingFormulas.enabledFormulaKeys);
  const resolvedEnabled = enabledFormulaKeys.length
    ? enabledFormulaKeys
    : current.formulas.enabledFormulaKeys?.length
      ? current.formulas.enabledFormulaKeys
      : [...DEFAULT_CLIENT_FORMULA_ASSIGNMENT.enabledFormulaKeys];

  const requestedActive = normalizeFormulaKey(incomingFormulas.activeFormulaKey);
  const fallbackActive = normalizeFormulaKey(current.formulas.activeFormulaKey)
    || resolvedEnabled[0]
    || DEFAULT_CLIENT_FORMULA_ASSIGNMENT.activeFormulaKey;
  const activeFormulaKey = requestedActive && resolvedEnabled.includes(requestedActive)
    ? requestedActive
    : fallbackActive;

  if (!resolvedEnabled.includes(activeFormulaKey)) {
    resolvedEnabled.push(activeFormulaKey);
  }

  return {
    userId,
    updatedAt: new Date().toISOString(),
    profile: {
      ...current.profile,
      ...(typeof incomingProfile.dietType === "string" ? { dietType: incomingProfile.dietType.trim() || current.profile.dietType } : {}),
      ...(incomingProfile.kidFriendlyFocus != null ? { kidFriendlyFocus: Boolean(incomingProfile.kidFriendlyFocus) } : {}),
      ...(typeof incomingProfile.emergencyAdviceEn === "string" ? { emergencyAdviceEn: incomingProfile.emergencyAdviceEn.trim() } : {}),
      ...(typeof incomingProfile.emergencyAdviceAr === "string" ? { emergencyAdviceAr: incomingProfile.emergencyAdviceAr.trim() } : {}),
      allergies: normalizeListInput(incomingProfile.allergies).length
        ? normalizeListInput(incomingProfile.allergies)
        : current.profile.allergies,
      conditions: normalizeListInput(incomingProfile.conditions).length
        ? normalizeListInput(incomingProfile.conditions)
        : current.profile.conditions,
      favoriteFoodsAdult: normalizeListInput(incomingProfile.favoriteFoodsAdult).length
        ? normalizeListInput(incomingProfile.favoriteFoodsAdult)
        : current.profile.favoriteFoodsAdult,
      favoriteFoodsKids: normalizeListInput(incomingProfile.favoriteFoodsKids).length
        ? normalizeListInput(incomingProfile.favoriteFoodsKids)
        : current.profile.favoriteFoodsKids,
      avoidFoods: normalizeListInput(incomingProfile.avoidFoods).length
        ? normalizeListInput(incomingProfile.avoidFoods)
        : current.profile.avoidFoods,
      disabledFoodNames: normalizeListInput(incomingProfile.disabledFoodNames).length
        ? normalizeListInput(incomingProfile.disabledFoodNames)
        : current.profile.disabledFoodNames,
      preferredReadyMealTags: normalizeListInput(incomingProfile.preferredReadyMealTags).length
        ? normalizeListInput(incomingProfile.preferredReadyMealTags)
        : current.profile.preferredReadyMealTags,
    },
    formulas: {
      enabledFormulaKeys: resolvedEnabled,
      activeFormulaKey,
      showEquationSteps: incomingFormulas.showEquationSteps != null
        ? Boolean(incomingFormulas.showEquationSteps)
        : current.formulas.showEquationSteps,
    },
  };
}

function saveClientPersonalizationSettings(settings: ClientPersonalizationSettings): ClientPersonalizationSettings {
  const store = getPersonalizationStore();
  store.set(settings.userId, settings);
  if (isMockMode) {
    saveStore();
  }
  return settings;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  if (isMockMode) {
    // Load persisted data first
    loadStore();
    startAutoSave();

    // Create default users only if they don't exist yet
    const { mockUsers } = await import("./mock-persist");
    const hasAdmin = Array.from(mockUsers.values()).some((u) => u.username === "admin");
    const hasTest = Array.from(mockUsers.values()).some((u) => u.username === "test");
    const hasDoctor = Array.from(mockUsers.values()).some((u) => u.username === "doctor");
    const hasCoach = Array.from(mockUsers.values()).some((u) => u.username === "coach");
    if (!hasTest) {
      await createUser("test", "test@nutri-intel.com", "test1234", "Test", "User", 25, 175, 70, "O+", false, "patient", "PAT-1001");
    }
    if (!hasDoctor) {
      await createUser("doctor", "doctor@nutri-intel.com", "doctor1234", "Demo", "Doctor", 38, 178, 82, "A+", false, "doctor");
    }
    if (!hasCoach) {
      await createUser("coach", "coach@nutri-intel.com", "coach1234", "Demo", "Coach", 34, 176, 76, "B+", false, "coach");
    }
    if (!hasAdmin) {
      await createUser("admin", "admin@nutri-intel.com", "admin1234", "Admin", "Owner", 30, 180, 80, "A+", true, "admin");
    }
    console.log("[mock] Test user  → username: test  | password: test1234");
    console.log("[mock] Doctor user → username: doctor | password: doctor1234");
    console.log("[mock] Coach user  → username: coach  | password: coach1234");
    console.log("[mock] Admin user → username: admin | password: admin1234");
  }

  const getDietaryPreferenceByUserId = async (userId: string) => {
    if (isMockMode) {
      return Array.from(mockDietaryPreferences.values()).find((entry) => entry.userId === userId) || null;
    }

    return db!.query.dietaryPreferences.findFirst({ where: eq(dietaryPreferences.userId, userId) });
  };

  const upsertDietaryPreferenceByUserId = async (userId: string, payload: Record<string, unknown>) => {
    if (isMockMode) {
      const existing = Array.from(mockDietaryPreferences.values()).find((entry) => entry.userId === userId);
      if (existing) {
        Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
        saveStore();
        return existing;
      }

      const id = mockId("pref");
      const created: MockDietaryPreference = {
        id,
        userId,
        ...payload,
        updatedAt: new Date().toISOString(),
      } as MockDietaryPreference;
      mockDietaryPreferences.set(id, created);
      saveStore();
      return created;
    }

    const validated = insertDietaryPreferencesSchema.parse(payload);
    const existing = await db!.query.dietaryPreferences.findFirst({ where: eq(dietaryPreferences.userId, userId) });

    if (existing) {
      const [updated] = await db!
        .update(dietaryPreferences)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(dietaryPreferences.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db!
      .insert(dietaryPreferences)
      .values({ userId, ...validated, updatedAt: new Date() })
      .returning();
    return created;
  };

  const getEmergencyMedicalInfoByUserId = async (userId: string) => {
    if (isMockMode) {
      return mockEmergencyMedicalInfo.get(userId) || null;
    }

    return db!.query.emergencyMedicalInfo.findFirst({ where: eq(emergencyMedicalInfo.userId, userId) });
  };

  const upsertEmergencyMedicalInfoByUserId = async (userId: string, payload: Record<string, unknown>) => {
    if (isMockMode) {
      const merged = {
        ...(mockEmergencyMedicalInfo.get(userId) || {}),
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      mockEmergencyMedicalInfo.set(userId, merged as Record<string, string>);
      saveStore();
      return merged;
    }

    const validated = insertEmergencyMedicalInfoSchema.parse(payload);
    const existing = await db!.query.emergencyMedicalInfo.findFirst({ where: eq(emergencyMedicalInfo.userId, userId) });

    if (existing) {
      const [updated] = await db!
        .update(emergencyMedicalInfo)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(emergencyMedicalInfo.userId, userId))
        .returning();
      return updated;
    }

    const [created] = await db!
      .insert(emergencyMedicalInfo)
      .values({ userId, ...validated })
      .returning();
    return created;
  };

  const buildMergedPersonalizationResponse = async (targetUser: any) => {
    const userId = targetUser.id as string;
    const settings = getOrCreateClientPersonalizationSettings(userId);
    const prefs = await getDietaryPreferenceByUserId(userId);
    const medical = await getEmergencyMedicalInfoByUserId(userId);

    const inferredAllergies = normalizeStringList([
      ...(settings.profile.allergies || []),
      ...splitCsvList((medical as any)?.allergies),
      ...splitCsvList((prefs as any)?.otherAllergies),
      (prefs as any)?.nutAllergy ? "nut allergy" : "",
      (prefs as any)?.shellFishAllergy ? "shellfish allergy" : "",
      (prefs as any)?.dairyFree ? "dairy" : "",
      (prefs as any)?.glutenFree ? "gluten" : "",
    ]);

    const inferredConditions = normalizeStringList([
      ...(settings.profile.conditions || []),
      ...splitCsvList((medical as any)?.conditions),
    ]);

    const mergedSettings: ClientPersonalizationSettings = {
      ...settings,
      profile: {
        ...settings.profile,
        dietType: settings.profile.dietType || (prefs as any)?.dietType || "balanced",
        allergies: inferredAllergies,
        conditions: inferredConditions,
      },
      formulas: {
        enabledFormulaKeys: normalizeFormulaKeys(settings.formulas.enabledFormulaKeys).length
          ? normalizeFormulaKeys(settings.formulas.enabledFormulaKeys)
          : [...DEFAULT_CLIENT_FORMULA_ASSIGNMENT.enabledFormulaKeys],
        activeFormulaKey:
          normalizeFormulaKey(settings.formulas.activeFormulaKey)
          || DEFAULT_CLIENT_FORMULA_ASSIGNMENT.activeFormulaKey,
        showEquationSteps: settings.formulas.showEquationSteps ?? true,
      },
      updatedAt: settings.updatedAt || new Date().toISOString(),
    };

    if (!mergedSettings.formulas.enabledFormulaKeys.includes(mergedSettings.formulas.activeFormulaKey)) {
      mergedSettings.formulas.enabledFormulaKeys.push(mergedSettings.formulas.activeFormulaKey);
    }

    saveClientPersonalizationSettings(mergedSettings);

    return {
      user: {
        id: targetUser.id,
        clientId: targetUser.clientId || null,
        username: targetUser.username,
        email: targetUser.email,
        firstName: targetUser.firstName || null,
        lastName: targetUser.lastName || null,
        age: targetUser.age || null,
        height: targetUser.height || null,
        weight: targetUser.weight || null,
        bloodType: targetUser.bloodType || null,
        role: getUserRole(targetUser),
      },
      preferences: {
        vegetarian: Boolean((prefs as any)?.vegetarian),
        vegan: Boolean((prefs as any)?.vegan),
        glutenFree: Boolean((prefs as any)?.glutenFree),
        dairyFree: Boolean((prefs as any)?.dairyFree),
        nutAllergy: Boolean((prefs as any)?.nutAllergy),
        shellFishAllergy: Boolean((prefs as any)?.shellFishAllergy),
        otherAllergies: (prefs as any)?.otherAllergies || null,
        dietType: (prefs as any)?.dietType || mergedSettings.profile.dietType,
        calorieGoal: (prefs as any)?.calorieGoal || null,
        proteinGoal: (prefs as any)?.proteinGoal || null,
      },
      medical: {
        bloodType: (medical as any)?.bloodType || targetUser.bloodType || null,
        allergies: (medical as any)?.allergies || null,
        conditions: (medical as any)?.conditions || null,
        medications: (medical as any)?.medications || null,
      },
      settings: mergedSettings,
      formulasCatalog: Object.values(NUTRITION_FORMULA_PRESETS),
    };
  };

  const applyAdminCustomizationUpdate = async (targetUser: any, payload: Record<string, any>) => {
    const userId = targetUser.id as string;

    if (payload.user && typeof payload.user === "object") {
      const userPatch: Record<string, unknown> = {};
      const allowedUserFields = ["firstName", "lastName", "email", "age", "height", "weight", "bloodType", "activityLevel"];
      for (const field of allowedUserFields) {
        if (payload.user[field] !== undefined) {
          userPatch[field] = payload.user[field];
        }
      }
      if (Object.keys(userPatch).length > 0) {
        await updateUser(userId, userPatch as any);
      }
    }

    const currentPrefs = await getDietaryPreferenceByUserId(userId);
    const incomingPrefs = payload.preferences && typeof payload.preferences === "object" ? payload.preferences : {};
    const prefsPayload = {
      ...(currentPrefs || {}),
      ...incomingPrefs,
      ...(payload.settings?.profile?.dietType ? { dietType: String(payload.settings.profile.dietType) } : {}),
      ...(payload.settings?.profile?.allergies
        ? { otherAllergies: normalizeListInput(payload.settings.profile.allergies).join(", ") || null }
        : {}),
    };
    await upsertDietaryPreferenceByUserId(userId, prefsPayload);

    const mergedSettings = mergeClientPersonalizationSettings(userId, payload.settings || {});
    saveClientPersonalizationSettings(mergedSettings);

    const currentMedical = await getEmergencyMedicalInfoByUserId(userId);
    const incomingMedical = payload.medical && typeof payload.medical === "object" ? payload.medical : {};
    const medicalPayload = {
      ...(currentMedical || {}),
      ...incomingMedical,
      ...(payload.user?.bloodType ? { bloodType: payload.user.bloodType } : {}),
      allergies: mergedSettings.profile.allergies.join(", ") || null,
      conditions: mergedSettings.profile.conditions.join(", ") || null,
    };
    await upsertEmergencyMedicalInfoByUserId(userId, medicalPayload);

    const refreshedUser = await findUserById(userId);
    return buildMergedPersonalizationResponse(refreshedUser || targetUser);
  };

  // ==================== AUTH ROUTES ====================

  // POST /api/auth/register - Register new user (supports patient/doctor/coach)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        age,
        height,
        weight,
        bloodType,
        role,
        accountType,
        clientId,
      } = req.body;

      // Only require username and password
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      // Check if username exists
      const existingUsername = await findUserByUsername(username);
      if (existingUsername) {
        return res
          .status(400)
          .json({ message: "Username already exists" });
      }

      // Generate email if not provided
      const userEmail = email || `${username}@nutri-intel.local`;
      const requestedRole = normalizeRole(role ?? accountType, "patient");
      const normalizedRole: UserRole = requestedRole === "admin" ? "patient" : requestedRole;
      const normalizedClientId = typeof clientId === "string" ? clientId.trim().toUpperCase() : undefined;

      // Create user
      const newUser = await createUser(
        username,
        userEmail,
        password,
        firstName,
        lastName,
        age,
        height,
        weight,
        bloodType,
        false,
        normalizedRole,
        normalizedClientId
      );

      // Create session
      setSessionUserId(req, newUser.id);

      const { password: _, ...userWithoutPassword } = newUser as any;
      const safeRole = getUserRole(newUser);
      res.status(201).json({
        ...userWithoutPassword,
        role: safeRole,
        clientId: (newUser as any).clientId,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/login - Login user
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Missing username or password" });
      }

      const user = await findUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      setSessionUserId(req, user.id);

      const { password: _, ...userWithoutPassword } = user as any;
      res.json({
        ...userWithoutPassword,
        role: getUserRole(user),
        clientId: (user as any).clientId,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/logout - Logout user
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // POST /api/auth/forgot-password - Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email, language } = req.body as { email?: string; language?: string };
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email in mock or DB mode
      let userId: string | null = null;
      const user = await findUserByEmail(email);
      if (user) userId = user.id;

      // Always respond with success (security: don't reveal if email exists)
      if (userId) {
        const token = generateResetToken(userId, email);
        const lang = language === "ar" ? "ar" : "en";
        try {
          await sendPasswordResetEmail(email, token, lang);
          const preview = getLastPreviewUrl();
          if (preview) {
            console.log(`[auth] Password reset preview: ${preview}`);
          }
        } catch (emailErr) {
          console.error("[auth] Failed to send reset email:", emailErr);
          // Still return success to avoid leaking info, but log the error
        }
      }

      res.json({ message: "If that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/reset-password - Reset password with token
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body as { token?: string; password?: string };
      if (!token || !password) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      const entry = consumeResetToken(token);
      if (!entry) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashed = await hashPassword(password);

      if (isMockMode) {
        const user = await findUserById(entry.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        (user as any).password = hashed;
        return res.json({ message: "Password reset successfully" });
      }

      await db!
        .update(users)
        .set({ password: hashed, updatedAt: new Date() })
        .where(eq(users.id, entry.userId));

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/change-password
  app.post("/api/auth/change-password", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password required" });
      }

      const user = await findUserById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = await comparePassword(currentPassword, (user as any).password);
      if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

      const strength = validatePasswordStrength(newPassword);
      if (!strength.isValid) return res.status(400).json({ message: strength.errors.join(", ") });

      const hashed = await hashPassword(newPassword);

      if (isMockMode) {
        (user as any).password = hashed;
      } else {
        await db!.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, userId));
      }

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/auth/me - Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await findUserById(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user as any;
      res.json({
        ...userWithoutPassword,
        role: getUserRole(user),
        clientId: (user as any).clientId,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== USER PROFILE ROUTES ====================
  app.get("/api/users/profile", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const user = await findUserById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }

      const user = await db!.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/profile", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { firstName, lastName, email, age, height, weight, bloodType } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (isMockMode) {
        const user = await findUserById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        Object.assign(user, { firstName, lastName, email, age, height, weight, bloodType });
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      }

      const updatedUser = await db!
        .update(users)
        .set({ firstName, lastName, email, age, height, weight, bloodType, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser[0]) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser[0];
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update profile error:", error);
      if ((error as any)?.code === "23505") {
        return res.status(400).json({ message: "Email already exists" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/onboarding — save goals + activity, mark onboarding complete
  app.post("/api/auth/onboarding", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { goals, activityLevel } = req.body;

      if (isMockMode) {
        const user = await findUserById(userId);
        if (user) {
          Object.assign(user, { goals: goals || [], activityLevel: activityLevel || "moderate", onboardingCompleted: true });
          const { password, ...u } = user;
          return res.json(u);
        }
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await db!
        .update(users)
        .set({ goals: goals || [], activityLevel: activityLevel || "moderate", onboardingCompleted: true, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updated[0]) return res.status(404).json({ message: "User not found" });
      const { password, ...u } = updated[0];
      res.json(u);
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== GOALS ROUTES ====================
  app.get("/api/goals", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      if (isMockMode) {
        const goals = Array.from(mockUserGoals.values())
          .filter((goal) => goal.userId === userId && goal.isActive)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return res.json(goals);
      }

      const goals = await db!.query.userGoals.findMany({
        where: and(eq(userGoals.userId, userId), eq(userGoals.isActive, true)),
        orderBy: (g, { desc }) => [desc(g.createdAt)],
      });
      res.json(goals);
    } catch (error) {
      console.error("Get goals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/goals", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const normalizedBody = { ...req.body };
      if (typeof normalizedBody.targetDate === "string") {
        const parsedDate = new Date(normalizedBody.targetDate);
        normalizedBody.targetDate = Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
      }

      if (isMockMode) {
        const id = mockId("goal");
        const now = new Date().toISOString();
        const mockTargetDate = normalizedBody.targetDate instanceof Date
          ? normalizedBody.targetDate.toISOString()
          : undefined;
        const goal: MockUserGoal = {
          id,
          userId,
          goalType: String(normalizedBody.goalType || "maintain"),
          targetWeight: normalizedBody.targetWeight != null ? Number(normalizedBody.targetWeight) : undefined,
          startWeight: normalizedBody.startWeight != null ? Number(normalizedBody.startWeight) : undefined,
          targetDate: mockTargetDate,
          targetCalories: normalizedBody.targetCalories != null ? Number(normalizedBody.targetCalories) : undefined,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };
        mockUserGoals.set(id, goal);
        return res.status(201).json(goal);
      }

      const validated = insertUserGoalSchema.parse(normalizedBody);
      const [goal] = await db!.insert(userGoals).values({ userId, ...validated }).returning();
      res.status(201).json(goal);
    } catch (error) {
      console.error("Create goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      const goalId = getRouteParam(req, "id");
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!goalId) return res.status(400).json({ message: "Goal id is required" });

      const normalizedBody = { ...req.body };
      if (typeof normalizedBody.targetDate === "string") {
        const parsedDate = new Date(normalizedBody.targetDate);
        normalizedBody.targetDate = Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
      }

      if (isMockMode) {
        const existing = mockUserGoals.get(goalId);
        if (!existing || existing.userId !== userId || !existing.isActive) {
          return res.status(404).json({ message: "Goal not found" });
        }

        const updated: MockUserGoal = {
          ...existing,
          ...(normalizedBody.goalType !== undefined ? { goalType: String(normalizedBody.goalType) } : {}),
          ...(normalizedBody.targetWeight !== undefined
            ? { targetWeight: normalizedBody.targetWeight == null ? undefined : Number(normalizedBody.targetWeight) }
            : {}),
          ...(normalizedBody.startWeight !== undefined
            ? { startWeight: normalizedBody.startWeight == null ? undefined : Number(normalizedBody.startWeight) }
            : {}),
          ...(normalizedBody.targetDate !== undefined
            ? {
                targetDate:
                  normalizedBody.targetDate instanceof Date
                    ? normalizedBody.targetDate.toISOString()
                    : undefined,
              }
            : {}),
          ...(normalizedBody.targetCalories !== undefined
            ? { targetCalories: normalizedBody.targetCalories == null ? undefined : Number(normalizedBody.targetCalories) }
            : {}),
          ...(normalizedBody.isActive !== undefined ? { isActive: Boolean(normalizedBody.isActive) } : {}),
          updatedAt: new Date().toISOString(),
        };

        mockUserGoals.set(updated.id, updated);
        return res.json(updated);
      }

      const updates = insertUserGoalSchema.partial().parse(normalizedBody);
      const [updated] = await db!
        .update(userGoals)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, userId)))
        .returning();
      if (!updated) return res.status(404).json({ message: "Goal not found" });
      res.json(updated);
    } catch (error) {
      console.error("Update goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/goals/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      const goalId = getRouteParam(req, "id");
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!goalId) return res.status(400).json({ message: "Goal id is required" });

      if (isMockMode) {
        const existing = mockUserGoals.get(goalId);
        if (!existing || existing.userId !== userId || !existing.isActive) {
          return res.status(404).json({ message: "Goal not found" });
        }
        mockUserGoals.set(existing.id, { ...existing, isActive: false, updatedAt: new Date().toISOString() });
        return res.json({ success: true });
      }

      await db!
        .update(userGoals)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(userGoals.id, goalId), eq(userGoals.userId, userId)));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete goal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== EMERGENCY ROUTES ====================
  app.get("/api/emergency/contacts", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (isMockMode) {
        const userContacts = Array.from(mockEmergencyContacts.values()).filter((c) => c.userId === userId);
        return res.json(userContacts);
      }
      const contacts = await db!.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId));
      res.json(contacts);
    } catch (error) {
      console.error("Get emergency contacts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/emergency/contacts", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (isMockMode) {
        const id = mockId("ec");
        const contact: MockEmergencyContact = {
          id,
          userId,
          name: req.body.name,
          phone: req.body.phone,
          countryCode: req.body.countryCode || "+966",
          relationship: req.body.relationship || "",
          isPrimary: req.body.isPrimary ?? false,
          createdAt: new Date(),
        };
        mockEmergencyContacts.set(id, contact);
        return res.status(201).json(contact);
      }
      const data = insertEmergencyContactSchema.parse(req.body);
      const [contact] = await db!.insert(emergencyContacts).values({ ...data, userId }).returning();
      res.status(201).json(contact);
    } catch (error) {
      console.error("Create emergency contact error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/emergency/contacts/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      const contactId = getRouteParam(req, "id");
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!contactId) return res.status(400).json({ message: "Contact id is required" });
      if (isMockMode) {
        const contact = mockEmergencyContacts.get(contactId);
        if (contact && contact.userId === userId) mockEmergencyContacts.delete(contactId);
        return res.json({ success: true });
      }
      await db!.delete(emergencyContacts).where(
        and(eq(emergencyContacts.id, contactId), eq(emergencyContacts.userId, userId))
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Delete emergency contact error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/emergency/medical-info", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (isMockMode) return res.json(mockEmergencyMedicalInfo.get(userId) || {});
      const info = await db!.query.emergencyMedicalInfo.findFirst({ where: eq(emergencyMedicalInfo.userId, userId) });
      res.json(info || {});
    } catch (error) {
      console.error("Get emergency medical info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/emergency/medical-info", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (isMockMode) {
        const info = { userId, ...req.body };
        mockEmergencyMedicalInfo.set(userId, info);
        return res.json(info);
      }
      const data = insertEmergencyMedicalInfoSchema.parse(req.body);
      const existing = await db!.query.emergencyMedicalInfo.findFirst({ where: eq(emergencyMedicalInfo.userId, userId) });
      if (existing) {
        const [updated] = await db!.update(emergencyMedicalInfo)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(emergencyMedicalInfo.userId, userId))
          .returning();
        return res.json(updated);
      }
      const [created] = await db!.insert(emergencyMedicalInfo).values({ ...data, userId }).returning();
      res.json(created);
    } catch (error) {
      console.error("Update emergency medical info error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== ACCOUNT DELETION ====================
  app.delete("/api/users/me", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (isMockMode) {
        req.session.destroy(() => res.json({ success: true }));
        return;
      }
      await db!.delete(users).where(eq(users.id, userId));
      req.session.destroy(() => res.json({ success: true }));
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/users/preferences", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const pref = Array.from(mockDietaryPreferences.values()).find((p) => p.userId === userId);
        return res.json(pref || {});
      }

      const preferences = await db!.query.dietaryPreferences.findFirst({
        where: eq(dietaryPreferences.userId, userId),
      });

      res.json(preferences || {});
    } catch (error) {
      console.error("Get preferences error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/preferences", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const existing = Array.from(mockDietaryPreferences.values()).find((p) => p.userId === userId);
        if (existing) {
          Object.assign(existing, req.body, { updatedAt: new Date() });
          return res.json(existing);
        } else {
          const id = mockId("pref");
          const pref: MockDietaryPreference = { id, userId, ...req.body, updatedAt: new Date() };
          mockDietaryPreferences.set(id, pref);
          return res.json(pref);
        }
      }

      const validated = insertDietaryPreferencesSchema.parse(req.body);

      const existing = await db!.query.dietaryPreferences.findFirst({
        where: eq(dietaryPreferences.userId, userId),
      });

      let preferences;
      if (existing) {
        const updated = await db!
          .update(dietaryPreferences)
          .set({ ...validated, updatedAt: new Date() })
          .where(eq(dietaryPreferences.userId, userId))
          .returning();
        preferences = updated[0];
      } else {
        const created = await db!
          .insert(dietaryPreferences)
          .values({ userId: userId, ...validated, updatedAt: new Date() })
          .returning();
        preferences = created[0];
      }

      res.json(preferences);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== PERSONALIZATION SETTINGS (SELF) ====================
  app.get("/api/profile/customization", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const response = await buildMergedPersonalizationResponse(user);
      res.json(response);
    } catch (error) {
      console.error("Get personalization settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/profile/customization", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const payload = (req.body || {}) as Record<string, any>;
      const currentPrefs = await getDietaryPreferenceByUserId(userId);
      const incomingPrefs = payload.preferences && typeof payload.preferences === "object" ? payload.preferences : {};
      const mergedSettings = mergeClientPersonalizationSettings(userId, {
        profile: payload.profile,
      });
      saveClientPersonalizationSettings(mergedSettings);

      await upsertDietaryPreferenceByUserId(userId, {
        ...(currentPrefs || {}),
        ...incomingPrefs,
        ...(payload.profile?.dietType ? { dietType: String(payload.profile.dietType) } : {}),
        ...(payload.profile?.allergies
          ? { otherAllergies: normalizeListInput(payload.profile.allergies).join(", ") || null }
          : {}),
      });

      const currentMedical = await getEmergencyMedicalInfoByUserId(userId);
      await upsertEmergencyMedicalInfoByUserId(userId, {
        ...(currentMedical || {}),
        ...(payload.medical && typeof payload.medical === "object" ? payload.medical : {}),
        allergies: mergedSettings.profile.allergies.join(", ") || null,
        conditions: mergedSettings.profile.conditions.join(", ") || null,
      });

      const refreshedUser = await findUserById(userId);
      const response = await buildMergedPersonalizationResponse(refreshedUser || user);
      res.json(response);
    } catch (error) {
      console.error("Update personalization settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== NUTRITION ROUTES ====================
  app.get("/api/nutrition/meals", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { startOfDay, endOfDay } = getDateRangeFromQuery(req.query.date);

      if (isMockMode) {
        const userMeals = Array.from(mockMeals.values()).filter(
          (m) => m.userId === userId && m.date >= startOfDay && m.date < endOfDay
        );
        return res.json(userMeals.map((meal) => ({ ...meal, mealType: meal.mealType || "other" })));
      }

      const mealsList = await db!.query.meals.findMany({
        where: and(eq(meals.userId, userId), gte(meals.date, startOfDay), lt(meals.date, endOfDay)),
        with: { nutrients: true },
      });

      const mealsWithNutrition = mealsList.map((m: any) => {
        const n = m.nutrients?.[0];
        return {
          ...m,
          calories: n ? Number(n.calories) : 0,
          protein: n ? Number(n.protein) : 0,
          carbs: n ? Number(n.carbohydrates) : 0,
          fat: n ? Number(n.fat) : 0,
        };
      });

      res.json(mealsWithNutrition);
    } catch (error) {
      console.error("Get meals error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/nutrition/meals", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const id = mockId("meal");
        const now = new Date();
        const meal: MockMeal = {
          id, userId,
          name: req.body.name || "Meal",
          mealType: req.body.mealType || "other",
          description: req.body.description ?? null,
          calories: req.body.calories,
          protein: req.body.protein,
          carbs: req.body.carbs,
          fat: req.body.fat,
          date: req.body.date ? new Date(req.body.date) : now,
          createdAt: now, updatedAt: now,
        };
        mockMeals.set(id, meal); saveStore();
        return res.status(201).json(meal);
      }

      const validated = insertMealSchema.parse(req.body);
      const newMeal = await db!.insert(meals).values({ userId: userId, ...validated }).returning();

      const { calories, protein, carbs, fat } = req.body;
      if (calories != null) {
        await db!.insert(nutrients).values({
          mealId: newMeal[0].id,
          calories: String(Number(calories)),
          protein: protein != null ? String(Number(protein)) : null,
          carbohydrates: carbs != null ? String(Number(carbs)) : null,
          fat: fat != null ? String(Number(fat)) : null,
        });
      }

      res.status(201).json({ ...newMeal[0], calories, protein, carbs, fat });
    } catch (error) {
      console.error("Create meal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/nutrition/meals/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = getRouteParam(req, "id");
      if (!id) return res.status(400).json({ message: "Meal id is required" });

      if (isMockMode) {
        const existing = mockMeals.get(id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Meal not found" });
        }
        const updated = {
          ...existing,
          ...req.body,
          id,
          userId,
          mealType: req.body.mealType || existing.mealType,
          description: req.body.description ?? existing.description ?? null,
          updatedAt: new Date(),
        };
        mockMeals.set(id, updated); saveStore();
        return res.json(updated);
      }

      const validated = insertMealSchema.parse(req.body);
      const updated = await db!
        .update(meals)
        .set({ ...validated, updatedAt: new Date() })
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .returning();

      if (!updated[0]) {
        return res.status(404).json({ message: "Meal not found" });
      }

      const { calories, protein, carbs, fat } = req.body;
      if (calories != null) {
        const existing = await db!.query.nutrients.findFirst({ where: eq(nutrients.mealId, id) });
        if (existing) {
          await db!.update(nutrients)
            .set({
              calories: String(Number(calories)),
              protein: protein != null ? String(Number(protein)) : null,
              carbohydrates: carbs != null ? String(Number(carbs)) : null,
              fat: fat != null ? String(Number(fat)) : null,
            })
            .where(eq(nutrients.mealId, id));
        } else {
          await db!.insert(nutrients).values({
            mealId: id,
            calories: String(Number(calories)),
            protein: protein != null ? String(Number(protein)) : null,
            carbohydrates: carbs != null ? String(Number(carbs)) : null,
            fat: fat != null ? String(Number(fat)) : null,
          });
        }
      }

      res.json({ ...updated[0], calories, protein, carbs, fat });
    } catch (error) {
      console.error("Update meal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/nutrition/meals/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = getRouteParam(req, "id");
      if (!id) return res.status(400).json({ message: "Meal id is required" });

      if (isMockMode) {
        const existing = mockMeals.get(id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Meal not found" });
        }
        mockMeals.delete(id);
        return res.status(204).send();
      }

      const deleted = await db!
        .delete(meals)
        .where(and(eq(meals.id, id), eq(meals.userId, userId)))
        .returning();

      if (!deleted[0]) {
        return res.status(404).json({ message: "Meal not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete meal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/nutrition/daily-summary", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { startOfDay, endOfDay } = getDateRangeFromQuery(req.query.date);

      if (isMockMode) {
        const userMeals = Array.from(mockMeals.values()).filter(
          (m) => m.userId === userId && m.date >= startOfDay && m.date < endOfDay
        );
        const summary = { date: startOfDay, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: userMeals.length };
        for (const meal of userMeals) {
          summary.totalCalories += Number(meal.calories || 0);
          summary.totalProtein += Number(meal.protein || 0);
          summary.totalCarbs += Number(meal.carbs || 0);
          summary.totalFat += Number(meal.fat || 0);
        }
        return res.json(summary);
      }

      const mealsList = await db!.query.meals.findMany({
        where: and(eq(meals.userId, userId), gte(meals.date, startOfDay), lt(meals.date, endOfDay)),
        with: { nutrients: true },
      });

      const summary = { date: startOfDay, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, mealCount: mealsList.length };

      for (const meal of mealsList as any[]) {
        for (const nutrient of (meal.nutrients ?? [])) {
          summary.totalCalories += Number(nutrient.calories || 0);
          summary.totalProtein += Number(nutrient.protein || 0);
          summary.totalCarbs += Number(nutrient.carbohydrates || 0);
          summary.totalFat += Number(nutrient.fat || 0);
        }
      }

      res.json(summary);
    } catch (error) {
      console.error("Get daily summary error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== HEALTH ROUTES ====================
  app.get("/api/health/metrics", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { date } = req.query;
      const dateObj = date ? new Date(date as string) : new Date();
      const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      if (isMockMode) {
        const userMetrics = Array.from(mockHealthMetrics.values()).filter(
          (m) => m.userId === userId && m.date >= startOfDay && m.date < endOfDay
        );
        return res.json(userMetrics);
      }

      const metricsList = await db!.query.healthMetrics.findMany({
        where: and(eq(healthMetrics.userId, userId), gte(healthMetrics.date, startOfDay), lt(healthMetrics.date, endOfDay)),
      });

      res.json(metricsList);
    } catch (error) {
      console.error("Get metrics error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/health/metrics", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const id = mockId("metric");
        const now = new Date();
        const metric: MockHealthMetric = {
          id, userId,
          type: req.body.type || "general",
          value: req.body.value || "0",
          unit: req.body.unit,
          date: req.body.date ? new Date(req.body.date) : now,
          notes: req.body.notes,
          createdAt: now, updatedAt: now,
        };
        mockHealthMetrics.set(id, metric);
        return res.status(201).json(metric);
      }

      const validated = insertHealthMetricSchema.parse(req.body);
      const newMetric = await db!.insert(healthMetrics).values({ userId: userId, ...validated }).returning();
      res.status(201).json(newMetric[0]);
    } catch (error) {
      console.error("Create metric error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/health/medications", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const userMeds = Array.from(mockMedications.values()).filter((m) => m.userId === userId);
        return res.json(userMeds);
      }

      const medicationsList = await db!.query.medications.findMany({ where: eq(medications.userId, userId) });
      res.json(medicationsList);
    } catch (error) {
      console.error("Get medications error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/health/medications", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const id = mockId("med");
        const now = new Date();
        const med: MockMedication = {
          id, userId,
          name: req.body.name, dosage: req.body.dosage, unit: req.body.unit,
          frequency: req.body.frequency || "once daily",
          reason: req.body.reason, time: req.body.time, relation: req.body.relation,
          status: req.body.status || "pending", warning: req.body.warning || "",
          startDate: req.body.startDate ? new Date(req.body.startDate) : now,
          endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
          prescribedBy: req.body.prescribedBy, notes: req.body.notes,
          createdAt: now, updatedAt: now,
        };
        mockMedications.set(id, med);
        return res.status(201).json(med);
      }

      const validated = insertMedicationSchema.parse(req.body);
      const newMedication = await db!.insert(medications).values({ userId: userId, ...validated }).returning();
      res.status(201).json(newMedication[0]);
    } catch (error) {
      console.error("Create medication error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/health/medications/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = getRouteParam(req, "id");
      if (!id) return res.status(400).json({ message: "Medication id is required" });

      if (isMockMode) {
        const existing = mockMedications.get(id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Medication not found" });
        }
        const updated = { ...existing, ...req.body, id, userId, updatedAt: new Date() };
        mockMedications.set(id, updated);
        return res.json(updated);
      }

      const validated = insertMedicationSchema.parse(req.body);
      const updatedMed = await db!
        .update(medications)
        .set({ ...validated, updatedAt: new Date() })
        .where(and(eq(medications.id, id), eq(medications.userId, userId)))
        .returning();

      if (!updatedMed[0]) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.json(updatedMed[0]);
    } catch (error) {
      console.error("Update medication error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/health/medications/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = getRouteParam(req, "id");
      if (!id) return res.status(400).json({ message: "Medication id is required" });

      if (isMockMode) {
        const existing = mockMedications.get(id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Medication not found" });
        }
        mockMedications.delete(id);
        return res.status(204).send();
      }

      const deleted = await db!
        .delete(medications)
        .where(and(eq(medications.id, id), eq(medications.userId, userId)))
        .returning();

      if (!deleted[0]) {
        return res.status(404).json({ message: "Medication not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete medication error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/health/journal", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const userEntries = Array.from(mockJournalEntries.values()).filter((e) => e.userId === userId);
        return res.json(userEntries);
      }

      const journalEntries = await db!.query.healthJournal.findMany({ where: eq(healthJournal.userId, userId) });
      res.json(journalEntries);
    } catch (error) {
      console.error("Get journal error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/health/journal", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const id = mockId("journal");
        const now = new Date();
        const entry: MockJournalEntry = {
          id, userId,
          title: req.body.title, content: req.body.content || "",
          mood: req.body.mood, symptoms: req.body.symptoms, tags: req.body.tags,
          date: req.body.date ? new Date(req.body.date) : now,
          createdAt: now, updatedAt: now,
        };
        mockJournalEntries.set(id, entry);
        return res.status(201).json(entry);
      }

      const validated = insertHealthJournalSchema.parse(req.body);
      const newEntry = await db!.insert(healthJournal).values({ userId: userId, ...validated }).returning();
      res.status(201).json(newEntry[0]);
    } catch (error) {
      console.error("Create journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/health/journal/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = getRouteParam(req, "id");
      if (!id) return res.status(400).json({ message: "Journal entry id is required" });

      if (isMockMode) {
        const existing = mockJournalEntries.get(id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Journal entry not found" });
        }
        const updated: MockJournalEntry = {
          ...existing,
          title: req.body.title ?? existing.title,
          content: req.body.content ?? existing.content,
          mood: req.body.mood ?? existing.mood,
          symptoms: req.body.symptoms ?? existing.symptoms,
          tags: req.body.tags ?? existing.tags,
          date: req.body.date ? new Date(req.body.date) : existing.date,
          updatedAt: new Date(),
        };
        mockJournalEntries.set(id, updated);
        return res.json(updated);
      }

      const validated = insertHealthJournalSchema.partial().parse(req.body);
      const updatedEntry = await db!
        .update(healthJournal)
        .set({ ...validated, updatedAt: new Date() })
        .where(and(eq(healthJournal.id, id), eq(healthJournal.userId, userId)))
        .returning();

      if (!updatedEntry[0]) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.json(updatedEntry[0]);
    } catch (error) {
      console.error("Update journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/health/journal/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const id = getRouteParam(req, "id");
      if (!id) return res.status(400).json({ message: "Journal entry id is required" });

      if (isMockMode) {
        const existing = mockJournalEntries.get(id);
        if (!existing || existing.userId !== userId) {
          return res.status(404).json({ message: "Journal entry not found" });
        }
        mockJournalEntries.delete(id);
        return res.status(204).send();
      }

      const deleted = await db!
        .delete(healthJournal)
        .where(and(eq(healthJournal.id, id), eq(healthJournal.userId, userId)))
        .returning();

      if (!deleted[0]) {
        return res.status(404).json({ message: "Journal entry not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete journal entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== CHATBOT ROUTES ====================
  const LLM_API_KEY = process.env.GROQ_API_KEY || "";
  const LLM_BASE_URL = "https://api.groq.com/openai/v1";
  const LLM_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  interface UserContext {
    calorieGoal?: number;
    dietType?: string;
    restrictions?: { vegetarian?: boolean; vegan?: boolean; glutenFree?: boolean };
  }

  async function generateAIResponse(userMessage: string, userContext: UserContext, conversationHistory: {role: string; content: string}[] = [], liveContext = "", callerSystemPrompt?: string): Promise<string> {
    if (!LLM_API_KEY) {
      return fallbackResponse(userMessage, userContext);
    }
    try {
      let systemPrompt: string;

      if (callerSystemPrompt) {
        // Caller (e.g. CoachingChat, DrugInteractions) supplies its own persona
        const contextAddition = liveContext ? `\n\nLive user data: ${liveContext}` : "";
        systemPrompt = callerSystemPrompt + contextAddition;
      } else {
        const contextSection = liveContext ? `\n\nLive user data:\n${liveContext}` : "";
        const prefsSection = Object.keys(userContext).length
          ? `\nUser preferences: ${JSON.stringify(userContext)}`
          : "";
        systemPrompt = `You are NutriMate, an expert AI nutrition and health assistant for the Nutri-Intel platform. You provide personalized, data-driven nutrition advice, meal planning guidance, health monitoring support, and wellness recommendations.${prefsSection}${contextSection}

Guidelines:
- Give evidence-based, personalized advice referencing the user's actual logged data when available
- Be concise but thorough
- Support both English and Arabic (respond in the same language the user writes in)
- Reference the user's dietary preferences, calorie goals, and recent meals/metrics when relevant
- Never provide specific medical diagnoses — encourage consulting healthcare providers for medical concerns
- Be friendly, motivating, and specific`;
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.slice(-10),
        { role: "user", content: userMessage }
      ];

      const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("LLM API error:", response.status, errText);
        return fallbackResponse(userMessage, userContext);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || fallbackResponse(userMessage, userContext);
    } catch (error) {
      console.error("LLM API call failed:", error);
      return fallbackResponse(userMessage, userContext);
    }
  }

  function fallbackResponse(userMessage: string, _userContext: UserContext): string {
    const isArabic = /[\u0600-\u06FF]/.test(userMessage);

    return isArabic
      ? "⚠️ خدمة الذكاء الاصطناعي غير متاحة حالياً. لم يتم إنشاء نصائح افتراضية حتى لا نعتمد على افتراضات. يرجى المحاولة لاحقاً."
      : "⚠️ AI service is currently unavailable. No fallback advice was generated to avoid assumption-based guidance. Please try again later.";
  }

  app.get("/api/chatbot/conversations/:conversationId", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = getRouteParam(req, "conversationId");
      if (!conversationId) return res.status(400).json({ message: "Conversation id is required" });

      if (isMockMode) {
        const msgs = Array.from(mockChatMessages.values()).filter(
          (m) => m.userId === userId && m.conversationId === conversationId
        );
        return res.json(msgs);
      }

      const messages = await db!.query.chatbotMessages.findMany({
        where: and(eq(chatbotMessages.userId, userId), eq(chatbotMessages.conversationId, conversationId)),
      });

      res.json(messages);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/chatbot/messages", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { conversationId, content } = req.body;

      if (!conversationId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (isMockMode) {
        const userMsgId = mockId("msg");
        const userMsg: MockChatMessage = { id: userMsgId, userId, conversationId, role: "user", content, messageType: "text", createdAt: new Date() };
        mockChatMessages.set(userMsgId, userMsg);

        const pref = Array.from(mockDietaryPreferences.values()).find((p) => p.userId === userId);
        const userContext = pref
          ? { calorieGoal: pref.calorieGoal, dietType: pref.dietType, restrictions: { vegetarian: pref.vegetarian, vegan: pref.vegan, glutenFree: pref.glutenFree } }
          : {};

        const aiResponse = await generateAIResponse(content, userContext);

        const aiMsgId = mockId("msg");
        const aiMsg: MockChatMessage = { id: aiMsgId, userId, conversationId, role: "assistant", content: aiResponse, messageType: "text", metadata: { context: userContext }, createdAt: new Date() };
        mockChatMessages.set(aiMsgId, aiMsg);

        return res.status(201).json({ userMessage: userMsg, assistantMessage: aiMsg });
      }

      const userMessage = await db!
        .insert(chatbotMessages)
        .values({ userId: userId, conversationId, role: "user", content, messageType: "text" })
        .returning();

      let userContext = {};
      const prefs = await db!.query.dietaryPreferences.findFirst({ where: eq(dietaryPreferences.userId, userId) });
      if (prefs) {
        userContext = { calorieGoal: prefs.calorieGoal, dietType: prefs.dietType, restrictions: { vegetarian: prefs.vegetarian, vegan: prefs.vegan, glutenFree: prefs.glutenFree } };
      }

      const aiResponse = await generateAIResponse(content, userContext);

      const assistantMessage = await db!
        .insert(chatbotMessages)
        .values({ userId: userId, conversationId, role: "assistant", content: aiResponse, messageType: "text", metadata: { context: userContext } })
        .returning();

      res.status(201).json({ userMessage: userMessage[0], assistantMessage: assistantMessage[0] });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/chatbot/conversations", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isMockMode) {
        const userMsgs = Array.from(mockChatMessages.values()).filter((m) => m.userId === userId);
        const conversationMap = new Map<string, { conversationId: string; lastMessage: string; messageCount: number }>();
        for (const msg of userMsgs) {
          if (!conversationMap.has(msg.conversationId)) {
            conversationMap.set(msg.conversationId, { conversationId: msg.conversationId, lastMessage: msg.content, messageCount: 0 });
          }
          const conv = conversationMap.get(msg.conversationId);
          if (conv) { conv.messageCount++; conv.lastMessage = msg.content; }
        }
        return res.json(Array.from(conversationMap.values()));
      }

      const messages = await db!.query.chatbotMessages.findMany({ where: eq(chatbotMessages.userId, userId) });

      const conversationMap = new Map<string, { conversationId: string; lastMessage: string; messageCount: number }>();
      for (const msg of messages) {
        if (!conversationMap.has(msg.conversationId)) {
          conversationMap.set(msg.conversationId, { conversationId: msg.conversationId, lastMessage: msg.content, messageCount: 0 });
        }
        const conv = conversationMap.get(msg.conversationId);
        if (conv) { conv.messageCount++; conv.lastMessage = msg.content; }
      }

      res.json(Array.from(conversationMap.values()));
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/chatbot/conversations/:conversationId", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = getRouteParam(req, "conversationId");
      if (!conversationId) return res.status(400).json({ message: "Conversation id is required" });

      if (isMockMode) {
        let deletedCount = 0;
        for (const [key, msg] of Array.from(mockChatMessages.entries())) {
          if (msg.userId === userId && msg.conversationId === conversationId) {
            mockChatMessages.delete(key);
            deletedCount++;
          }
        }
        if (deletedCount === 0) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        return res.json({ message: "Conversation deleted successfully", deletedCount });
      }

      const deleted = await db!
        .delete(chatbotMessages)
        .where(and(eq(chatbotMessages.userId, userId), eq(chatbotMessages.conversationId, conversationId)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      res.json({ message: "Conversation deleted successfully", deletedCount: deleted.length });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/chat - Unified chat endpoint
  // Supports two request formats:
  //   Format A (simple): { message: string, history?: [{role, content}] }
  //   Format B (messages array): { messages: [{role, content}][] }
  // Always returns: { reply, message, choices }
  const chatRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please wait before sending more messages." },
  });

  app.post("/api/chat", chatRateLimiter, async (req: Request, res: Response) => {
    try {
      let userMessage: string;
      let conversationHistory: { role: string; content: string }[];
      // Format B may supply its own system prompt — extract it
      let callerSystemPrompt: string | undefined;

      if (Array.isArray(req.body.messages)) {
        const msgs: { role: string; content: string }[] = req.body.messages;
        const systemMsg = msgs.find((m) => m.role === "system");
        callerSystemPrompt = systemMsg?.content;
        const userMsgs = msgs.filter((m) => m.role === "user");
        userMessage = userMsgs[userMsgs.length - 1]?.content || "";
        conversationHistory = msgs.filter((m) => m.role !== "system").slice(0, -1);
      } else {
        userMessage = req.body.message as string;
        conversationHistory = ((req.body.history as { role: string; content: string }[]) || []);
      }

      if (!userMessage) {
        return res.status(400).json({ message: "Missing message content" });
      }

      // Build user context from session data
      const userId = sessionUserId(req);
      let userContext: UserContext = {};
      const contextParts: string[] = [];

      if (userId) {
        // Dietary preferences
        if (isMockMode) {
          const pref = Array.from(mockDietaryPreferences.values()).find((p) => p.userId === userId);
          if (pref) {
            userContext = { calorieGoal: pref.calorieGoal ?? undefined, dietType: pref.dietType ?? undefined, restrictions: { vegetarian: pref.vegetarian ?? undefined, vegan: pref.vegan ?? undefined, glutenFree: pref.glutenFree ?? undefined } };
          }
        } else if (db) {
          const pref = await db!.query.dietaryPreferences.findFirst({ where: eq(dietaryPreferences.userId, userId) });
          if (pref) {
            userContext = { calorieGoal: pref.calorieGoal ?? undefined, dietType: pref.dietType ?? undefined, restrictions: { vegetarian: pref.vegetarian ?? undefined, vegan: pref.vegan ?? undefined, glutenFree: pref.glutenFree ?? undefined } };
          }
        }

        // Recent meals (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (isMockMode) {
          const recentMeals = Array.from(mockMeals.values())
            .filter((m) => m.userId === userId && new Date(m.date) >= sevenDaysAgo)
            .slice(0, 14);
          if (recentMeals.length > 0) {
            const totalCals = recentMeals.reduce((s, m) => s + (m.calories || 0), 0);
            const avgCals = Math.round(totalCals / 7);
            contextParts.push(`Recent meals (last 7 days): ${recentMeals.map((m) => `${m.name} (${m.calories || "?"} kcal)`).join(", ")}. Estimated average daily calories: ${avgCals} kcal.`);
          }
        } else if (db) {
          const recentMeals = await db!.query.meals.findMany({ where: and(eq(meals.userId, userId), gte(meals.date, sevenDaysAgo)) });
          if (recentMeals.length > 0) {
            contextParts.push(`User has logged ${recentMeals.length} meals in the past 7 days.`);
          }
        }

        // Recent health metrics
        if (isMockMode) {
          const recentMetrics = Array.from(mockHealthMetrics.values())
            .filter((m) => m.userId === userId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          if (recentMetrics.length > 0) {
            contextParts.push(`Recent health readings: ${recentMetrics.map((m) => `${m.type}: ${m.value} ${m.unit || ""}`).join(", ")}.`);
          }
        } else if (db) {
          const recentMetrics = await db!.query.healthMetrics.findMany({ where: eq(healthMetrics.userId, userId) });
          if (recentMetrics.length > 0) {
            contextParts.push(`User has ${recentMetrics.length} health metric records.`);
          }
        }

        // Active medications
        if (isMockMode) {
          const userMeds = Array.from(mockMedications.values()).filter((m) => m.userId === userId);
          if (userMeds.length > 0) {
            contextParts.push(`Current medications: ${userMeds.map((m) => `${m.name} ${m.dosage}${m.unit ? " " + m.unit : ""} (${m.frequency})`).join(", ")}.`);
          }
        } else if (db) {
          const userMeds = await db!.query.medications.findMany({ where: eq(medications.userId, userId) });
          if (userMeds.length > 0) {
            contextParts.push(`User takes ${userMeds.length} medication(s): ${userMeds.map((m) => m.name).join(", ")}.`);
          }
        }
      }

      const reply = await generateAIResponse(userMessage, userContext, conversationHistory, contextParts.join(" "), callerSystemPrompt);
      res.json({
        reply,
        message: reply,
        choices: [{ message: { role: "assistant", content: reply } }],
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== COACHING SESSION ROUTES ====================
  app.get("/api/coaching/sessions", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const currentUser = await findUserById(userId);
      const role = getUserRole(currentUser);
      const sessions = Array.from(mockCoachingSessions.values()).filter((s) => {
        if (role === "admin") return true;
        if (role === "doctor" || role === "coach") return s.coachUserId === userId;
        return s.userId === userId;
      });
      sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/coaching/sessions", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const currentUser = await findUserById(userId);
      if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

      const role = getUserRole(currentUser);
      const { title, notes, scheduledAt, status, coachUserId: coachUserIdRaw, userId: patientIdRaw, patientId, meetingUrl } = req.body;
      if (!title) return res.status(400).json({ message: "Title is required" });

      let sessionPatientId = userId;
      let sessionCoachUserId: string | undefined;

      if (role === "patient") {
        sessionPatientId = userId;
        if (typeof coachUserIdRaw === "string" && coachUserIdRaw.trim()) {
          sessionCoachUserId = coachUserIdRaw.trim();
        }
      } else if (role === "doctor" || role === "coach") {
        sessionPatientId = typeof patientIdRaw === "string" && patientIdRaw.trim()
          ? patientIdRaw.trim()
          : (typeof patientId === "string" && patientId.trim() ? patientId.trim() : userId);
        sessionCoachUserId = userId;
      } else {
        sessionPatientId = typeof patientIdRaw === "string" && patientIdRaw.trim()
          ? patientIdRaw.trim()
          : (typeof patientId === "string" && patientId.trim() ? patientId.trim() : userId);
        sessionCoachUserId = typeof coachUserIdRaw === "string" && coachUserIdRaw.trim() ? coachUserIdRaw.trim() : undefined;
      }

      const id = mockId("session");
      const normalizedScheduledAt = parseOptionalIsoDate(scheduledAt);
      const normalizedMeetingUrl =
        typeof meetingUrl === "string" && meetingUrl.trim().startsWith("http")
          ? meetingUrl.trim()
          : generateGoogleMeetUrl();
      const nowIso = new Date().toISOString();
      const session: MockCoachingSession = {
        id,
        userId: sessionPatientId,
        coachUserId: sessionCoachUserId,
        title,
        notes,
        meetingUrl: normalizedMeetingUrl,
        status: status || "pending",
        scheduledAt: normalizedScheduledAt,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      mockCoachingSessions.set(id, session);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/coaching/sessions/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      const sessionId = getRouteParam(req, "id");
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!sessionId) return res.status(400).json({ message: "Session id is required" });

      const currentUser = await findUserById(userId);
      if (!currentUser) return res.status(401).json({ message: "Unauthorized" });
      const role = getUserRole(currentUser);

      const session = mockCoachingSessions.get(sessionId);
      if (!session) return res.status(404).json({ message: "Not found" });

      const canAccess =
        role === "admin" ||
        (role === "patient" && session.userId === userId) ||
        ((role === "doctor" || role === "coach") && session.coachUserId === userId);

      if (!canAccess) return res.status(403).json({ message: "Forbidden" });

      const updates: Partial<MockCoachingSession> = {
        ...(typeof req.body.title === "string" ? { title: req.body.title } : {}),
        ...(typeof req.body.notes === "string" ? { notes: req.body.notes } : {}),
        ...(typeof req.body.status === "string" ? { status: req.body.status } : {}),
        ...(typeof req.body.scheduledAt === "string" ? { scheduledAt: parseOptionalIsoDate(req.body.scheduledAt) } : {}),
        ...(typeof req.body.meetingUrl === "string" ? { meetingUrl: req.body.meetingUrl } : {}),
      };

      if (role === "admin") {
        if (typeof req.body.userId === "string" && req.body.userId.trim()) {
          updates.userId = req.body.userId.trim();
        }
        if (typeof req.body.coachUserId === "string" && req.body.coachUserId.trim()) {
          updates.coachUserId = req.body.coachUserId.trim();
        }
      }

      const updated = { ...session, ...updates, updatedAt: new Date().toISOString() };
      mockCoachingSessions.set(session.id, updated);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/coaching/sessions/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      const sessionId = getRouteParam(req, "id");
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!sessionId) return res.status(400).json({ message: "Session id is required" });

      const currentUser = await findUserById(userId);
      if (!currentUser) return res.status(401).json({ message: "Unauthorized" });
      const role = getUserRole(currentUser);

      const session = mockCoachingSessions.get(sessionId);
      if (!session) return res.status(404).json({ message: "Not found" });

      const canAccess =
        role === "admin" ||
        (role === "patient" && session.userId === userId) ||
        ((role === "doctor" || role === "coach") && session.coachUserId === userId);

      if (!canAccess) return res.status(403).json({ message: "Forbidden" });

      mockCoachingSessions.delete(session.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Practitioner/admin lookup by patient ID (user id or clientId)
  app.get("/api/patients/:patientId/overview", async (req: Request, res: Response) => {
    try {
      const requesterId = sessionUserId(req);
      if (!requesterId) return res.status(401).json({ message: "Unauthorized" });

      const requester = await findUserById(requesterId);
      const requesterRole = getUserRole(requester);
      if (requesterRole !== "admin" && requesterRole !== "doctor" && requesterRole !== "coach") {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (!hasRoleCapability(requesterRole, "canSearchAnyPatientById")) {
        return res.status(403).json({ message: "Patient search is disabled for this role" });
      }

      const lookup = String(getRouteParam(req, "patientId") || "").trim().toLowerCase();
      if (!lookup) return res.status(400).json({ message: "patientId is required" });

      const allUsers = await getAllUsers();
      const patient = allUsers.find((u: any) => {
        const id = String(u.id || "").toLowerCase();
        const cid = String(u.clientId || "").toLowerCase();
        return id === lookup || cid === lookup;
      });

      if (!patient) return res.status(404).json({ message: "Patient not found" });
      if (getUserRole(patient) !== "patient") {
        return res.status(400).json({ message: "Target user is not a patient" });
      }

      const patientMetrics = Array.from(mockHealthMetrics.values())
        .filter((m) => m.userId === patient.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const patientGoals = Array.from(mockUserGoals.values()).filter((g) => g.userId === patient.id && g.isActive);
      const patientMeds = Array.from(mockMedications.values()).filter((m) => m.userId === patient.id);
      const patientSessions = Array.from(mockCoachingSessions.values())
        .filter((s) => s.userId === patient.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const latestMetric = patientMetrics[0] || null;
      const heightCm = Number((patient as any).height || 0);
      const weightKg = Number((patient as any).weight || 0);
      const bmi = heightCm > 0 && weightKg > 0 ? Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10 : null;

      return res.json({
        id: patient.id,
        clientId: (patient as any).clientId || null,
        username: patient.username,
        firstName: (patient as any).firstName || null,
        lastName: (patient as any).lastName || null,
        age: (patient as any).age || null,
        bloodType: (patient as any).bloodType || null,
        height: (patient as any).height || null,
        weight: (patient as any).weight || null,
        bmi,
        activeGoalsCount: patientGoals.length,
        medicationsCount: patientMeds.length,
        sessionsCount: patientSessions.length,
        latestSession: patientSessions[0] || null,
        latestMetric,
      });
    } catch (error) {
      console.error("Patient overview lookup error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== WATER TRACKING ROUTES ====================
  app.get("/api/water/logs", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { date } = req.query;
      let logs = Array.from(mockWaterLogs.values()).filter((l) => l.userId === userId);
      if (date) {
        const d = new Date(date as string);
        logs = logs.filter((l) => {
          const ld = new Date(l.date);
          return ld.toDateString() === d.toDateString();
        });
      }
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/water/logs", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { amount, unit, date } = req.body;
      if (!amount) return res.status(400).json({ message: "Amount is required" });
      const id = mockId("water");
      const log: MockWaterLog = {
        id, userId, amount: Number(amount), unit: unit || "ml",
        date: date ? new Date(date) : new Date(), createdAt: new Date(),
      };
      mockWaterLogs.set(id, log);
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/water/logs/:id", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      const logId = getRouteParam(req, "id");
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!logId) return res.status(400).json({ message: "Water log id is required" });
      const log = mockWaterLogs.get(logId);
      if (!log || log.userId !== userId) return res.status(404).json({ message: "Not found" });
      mockWaterLogs.delete(log.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== STREAK / PROGRESS ROUTES ====================
  app.get("/api/progress/streak", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      // Calculate streak from meals logged
      const userMeals = Array.from(mockMeals.values())
        .filter((m) => m.userId === userId)
        .map((m) => new Date(m.date).toDateString());
      const uniqueDays = Array.from(new Set(userMeals));
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (uniqueDays.includes(d.toDateString())) {
          streak++;
        } else {
          break;
        }
      }
      res.json({ streak, totalDaysLogged: uniqueDays.length });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== FOOD DATABASE ROUTES ====================
  app.get("/api/food-database/categories", (_req: Request, res: Response) => {
    res.json(foodCategories);
  });

  app.get("/api/food-database/foods", (req: Request, res: Response) => {
    const query = (req.query.q as string) || "";
    const category = req.query.category as string | undefined;
    const results = searchFoods(query, category);
    res.json(results);
  });

  app.post("/api/food-database/calculate", (req: Request, res: Response) => {
    const { foodName, servingUnit, quantity } = req.body;
    const food = foodDatabase.find((f) => f.name === foodName);
    if (!food) {
      return res.status(404).json({ message: "Food not found" });
    }
    const nutrition = calculateNutrition(food, servingUnit, quantity || 1);
    res.json(nutrition);
  });

  // POST /api/analyze-meal-photo — vision AI analysis of food photo
  app.post("/api/analyze-meal-photo", async (req: Request, res: Response) => {
    try {
      const userId = sessionUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) return res.status(400).json({ message: "Missing image data" });

      const isArabic = req.body.language === "ar";

      if (!LLM_API_KEY) {
        return res.json({
          name: isArabic ? "وجبة غير محددة" : "Unknown meal",
          calories: 0, protein: 0, carbs: 0, fat: 0,
          message: isArabic ? "خدمة التحليل غير متاحة. أدخل البيانات يدوياً." : "Analysis service unavailable. Please enter manually.",
        });
      }

      // Use llama-3.2-11b-vision-preview (Groq vision model)
      const visionModel = "llama-3.2-11b-vision-preview";
      const prompt = isArabic
        ? "حلل الطعام في هذه الصورة. أعطني: اسم الوجبة، السعرات الحرارية (kcal)، البروتين (g)، الكربوهيدرات (g)، الدهون (g). الإجابة بصيغة JSON فقط: {\"name\": \"\", \"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fat\": 0}"
        : "Analyze the food in this image. Provide: meal name, calories (kcal), protein (g), carbs (g), fat (g). Reply ONLY in JSON: {\"name\": \"\", \"calories\": 0, \"protein\": 0, \"carbs\": 0, \"fat\": 0}";

      const visionRes = await fetch(`${LLM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LLM_API_KEY}` },
        body: JSON.stringify({
          model: visionModel,
          messages: [{
            role: "user",
            content: [
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
              { type: "text", text: prompt },
            ],
          }],
          max_tokens: 256,
          temperature: 0.1,
        }),
      });

      if (!visionRes.ok) {
        return res.json({ name: isArabic ? "وجبة" : "Meal", calories: 0, protein: 0, carbs: 0, fat: 0, message: isArabic ? "تعذّر التحليل" : "Analysis failed" });
      }

      const visionData = await visionRes.json();
      const raw = visionData.choices?.[0]?.message?.content || "{}";
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
        res.json({ name: parsed.name || "Meal", calories: Number(parsed.calories) || 0, protein: Number(parsed.protein) || 0, carbs: Number(parsed.carbs) || 0, fat: Number(parsed.fat) || 0 });
      } catch {
        res.json({ name: "Meal", calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    } catch (error) {
      console.error("Meal photo analysis error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ==================== FILE UPLOAD ROUTES ====================
  app.post("/api/upload", (req: Request, res: Response) => {
    try {
      const { filename, mimetype, data } = req.body;
      if (!filename || !data) {
        return res.status(400).json({ message: "Missing filename or data" });
      }

      const id = mockId("upload");
      const url = `/api/uploads/${id}`;
      mockUploads.set(id, { id, filename, mimetype: mimetype || "application/octet-stream", data, url, createdAt: new Date() });

      res.status(201).json({ id, url, filename, mimetype });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get("/api/uploads/:id", (req: Request, res: Response) => {
    const uploadId = getRouteParam(req, "id");
    if (!uploadId) {
      return res.status(400).json({ message: "Upload id is required" });
    }
    const upload = mockUploads.get(uploadId);
    if (!upload) {
      return res.status(404).json({ message: "File not found" });
    }
    const buffer = Buffer.from(upload.data, "base64");
    res.setHeader("Content-Type", upload.mimetype);
    res.setHeader("Content-Disposition", `inline; filename="${upload.filename}"`);
    res.send(buffer);
  });

  // ==================== ADMIN ROUTES ====================

  const requireAdmin = async (req: Request, res: Response, next: Function) => {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const user = await findUserById(userId);
    if (!user || !(user as any).isAdmin) return res.status(403).json({ message: "Forbidden" });
    next();
  };

  const requireFormulaManager = async (req: Request, res: Response, next: Function) => {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await findUserById(userId);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const role = getUserRole(user);
    const canCustomize = hasRoleCapability(role, "canCustomizePatientFormulas");
    if (!canCustomize) {
      return res.status(403).json({ message: "Formula customization is disabled for this role" });
    }

    next();
  };

  const resolveUserByClientIdentifier = async (identifierRaw: string) => {
    const identifier = identifierRaw.trim().toLowerCase();
    if (!identifier) return null;
    const allUsers = await getAllUsers();

    return allUsers.find((candidate: any) => {
      const id = String(candidate.id || "").trim().toLowerCase();
      const clientId = String(candidate.clientId || "").trim().toLowerCase();
      const username = String(candidate.username || "").trim().toLowerCase();
      return id === identifier || clientId === identifier || username === identifier;
    }) || null;
  };

  app.get("/api/admin/formulas/catalog", requireAdmin, async (_req: Request, res: Response) => {
    res.json(Object.values(NUTRITION_FORMULA_PRESETS));
  });

  app.get("/api/system-control/current", async (req: Request, res: Response) => {
    const userId = sessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = getUserRole(user);
    const config = getSystemControlConfig();
    const roleKey = normalizeSystemRole(role);

    res.json({
      role,
      roleCapabilities: config.roleCapabilities[roleKey],
      branding: config.branding,
      uiLabels: config.uiLabels,
    });
  });

  app.get("/api/admin/system-control", requireAdmin, async (_req: Request, res: Response) => {
    res.json(getSystemControlConfig());
  });

  app.put("/api/admin/system-control", requireAdmin, async (req: Request, res: Response) => {
    try {
      const current = getSystemControlConfig();
      const merged = mergeSystemControlConfig(current, req.body || {});
      const saved = saveSystemControlConfig(merged);
      res.json(saved);
    } catch (error) {
      console.error("Admin update system control error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/client-customization/:clientId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const clientId = getRouteParam(req, "clientId");
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }

      const user = await resolveUserByClientIdentifier(clientId);
      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      const role = getUserRole(user);
      if (role !== "patient") {
        return res.status(400).json({ message: "Target account is not a patient" });
      }

      const response = await buildMergedPersonalizationResponse(user);
      res.json(response);
    } catch (error) {
      console.error("Admin get client customization error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/client-customization/:clientId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const clientId = getRouteParam(req, "clientId");
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }

      const user = await resolveUserByClientIdentifier(clientId);
      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      const role = getUserRole(user);
      if (role !== "patient") {
        return res.status(400).json({ message: "Target account is not a patient" });
      }

      const payload = (req.body || {}) as Record<string, any>;
      const response = await applyAdminCustomizationUpdate(user, payload);
      res.json(response);
    } catch (error) {
      console.error("Admin update client customization error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/practitioner/formulas/catalog", requireFormulaManager, async (_req: Request, res: Response) => {
    res.json(Object.values(NUTRITION_FORMULA_PRESETS));
  });

  app.get("/api/practitioner/client-customization/:clientId", requireFormulaManager, async (req: Request, res: Response) => {
    try {
      const clientId = getRouteParam(req, "clientId");
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }

      const user = await resolveUserByClientIdentifier(clientId);
      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      const role = getUserRole(user);
      if (role !== "patient") {
        return res.status(400).json({ message: "Target account is not a patient" });
      }

      const response = await buildMergedPersonalizationResponse(user);
      res.json(response);
    } catch (error) {
      console.error("Practitioner get client customization error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/practitioner/client-customization/:clientId", requireFormulaManager, async (req: Request, res: Response) => {
    try {
      const clientId = getRouteParam(req, "clientId");
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }

      const user = await resolveUserByClientIdentifier(clientId);
      if (!user) {
        return res.status(404).json({ message: "Client not found" });
      }

      const role = getUserRole(user);
      if (role !== "patient") {
        return res.status(400).json({ message: "Target account is not a patient" });
      }

      const payload = (req.body || {}) as Record<string, any>;
      const response = await applyAdminCustomizationUpdate(user, payload);
      res.json(response);
    } catch (error) {
      console.error("Practitioner update client customization error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/admin/practitioners — list doctors and coaches
  app.get("/api/admin/practitioners", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await getAllUsers();
      const practitioners = allUsers
        .filter((u: any) => {
          const role = getUserRole(u);
          return role === "doctor" || role === "coach";
        })
        .map((u: any) => {
          const { password: _, ...safe } = u;
          return {
            ...safe,
            role: getUserRole(u),
          };
        });
      res.json(practitioners);
    } catch (error) {
      console.error("Admin practitioners list error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/admin/practitioners — create doctor/coach account
  app.post("/api/admin/practitioners", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { username, email, password, firstName, lastName, role } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const practitionerRole = normalizeRole(role, "coach");
      if (practitionerRole !== "doctor" && practitionerRole !== "coach") {
        return res.status(400).json({ message: "Role must be doctor or coach" });
      }

      const existingUsername = await findUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const userEmail = email || `${username}@nutri-intel.local`;
      const created = await createUser(
        username,
        userEmail,
        password,
        firstName,
        lastName,
        undefined,
        undefined,
        undefined,
        undefined,
        false,
        practitionerRole
      );

      const { password: _, ...safe } = created as any;
      res.status(201).json({
        ...safe,
        role: practitionerRole,
      });
    } catch (error) {
      console.error("Admin create practitioner error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/admin/stats — system-wide stats
  app.get("/api/admin/stats", requireAdmin, async (req: Request, res: Response) => {
    try {
      if (isMockMode) {
        const allUsers = await getAllUsers();
        const totalMeals = Array.from(mockMeals.values()).length;
        const totalMetrics = Array.from(mockHealthMetrics.values()).length;
        const totalMeds = Array.from(mockMedications.values()).length;
        const totalMessages = Array.from(mockChatMessages.values()).length;
        const totalContacts = Array.from(mockEmergencyContacts.values()).length;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const newToday = allUsers.filter((u) => (u as any).createdAt >= today).length;
        return res.json({
          totalUsers: allUsers.length,
          newUsersToday: newToday,
          totalMeals,
          totalHealthMetrics: totalMetrics,
          totalMedications: totalMeds,
          totalChatMessages: totalMessages,
          totalEmergencyContacts: totalContacts,
        });
      }
      const [allUsers, allMeals, allMetrics, allMeds, allMessages] = await Promise.all([
        db!.select().from(users),
        db!.select().from(meals),
        db!.select().from(healthMetrics),
        db!.select().from(medications),
        db!.select().from(chatbotMessages),
      ]);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const newToday = allUsers.filter((u) => u.createdAt >= today).length;
      res.json({
        totalUsers: allUsers.length,
        newUsersToday: newToday,
        totalMeals: allMeals.length,
        totalHealthMetrics: allMetrics.length,
        totalMedications: allMeds.length,
        totalChatMessages: allMessages.length,
        totalEmergencyContacts: 0,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/admin/users — all users with activity counts
  app.get("/api/admin/users", requireAdmin, async (req: Request, res: Response) => {
    try {
      if (isMockMode) {
        const allUsers = await getAllUsers();
        const enriched = allUsers.map((u) => {
          const userMeals = Array.from(mockMeals.values()).filter((m) => m.userId === u.id);
          const userMetrics = Array.from(mockHealthMetrics.values()).filter((m) => m.userId === u.id);
          const userMeds = Array.from(mockMedications.values()).filter((m) => m.userId === u.id);
          const userMessages = Array.from(mockChatMessages.values()).filter((m) => m.userId === u.id);
          const { password: _, ...safe } = u as any;
          return {
            ...safe,
            role: getUserRole(u),
            clientId: (u as any).clientId || null,
            mealsCount: userMeals.length,
            metricsCount: userMetrics.length,
            medsCount: userMeds.length,
            messagesCount: userMessages.length,
          };
        });
        return res.json(enriched);
      }
      const allUsers = await db!.select().from(users);
      const enriched = await Promise.all(allUsers.map(async (u) => {
        const [userMeals, userMetrics, userMeds, userMessages] = await Promise.all([
          db!.select().from(meals).where(eq(meals.userId, u.id)),
          db!.select().from(healthMetrics).where(eq(healthMetrics.userId, u.id)),
          db!.select().from(medications).where(eq(medications.userId, u.id)),
          db!.select().from(chatbotMessages).where(eq(chatbotMessages.userId, u.id)),
        ]);
        const { password: _, ...safe } = u;
        return {
          ...safe,
          role: getUserRole(u),
          clientId: (u as any).clientId || null,
          mealsCount: userMeals.length,
          metricsCount: userMetrics.length,
          medsCount: userMeds.length,
          messagesCount: userMessages.length,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/admin/users/:id — full details of one user
  app.get("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const uid = getRouteParam(req, "id");
      if (!uid) return res.status(400).json({ message: "User id is required" });
      if (isMockMode) {
        const u = await findUserById(uid);
        if (!u) return res.status(404).json({ message: "User not found" });
        const userMeals        = Array.from(mockMeals.values()).filter((m) => m.userId === uid);
        const userMetrics      = Array.from(mockHealthMetrics.values()).filter((m) => m.userId === uid);
        const userMeds         = Array.from(mockMedications.values()).filter((m) => m.userId === uid);
        const userMessages     = Array.from(mockChatMessages.values()).filter((m) => m.userId === uid);
        const userContacts     = Array.from(mockEmergencyContacts.values()).filter((m) => m.userId === uid);
        const userJournal      = Array.from(mockJournalEntries.values()).filter((m) => m.userId === uid);
        const userWater        = Array.from(mockWaterLogs.values()).filter((m) => m.userId === uid);
        const userGoalsList    = Array.from(mockUserGoals.values()).filter((m) => m.userId === uid);
        const userDietPref     = Array.from(mockDietaryPrefs.values()).find((m) => m.userId === uid) || null;
        const userCoaching     = Array.from(mockCoachingSessions.values()).filter((m) => m.userId === uid);
        const { password: _, ...safe } = u as any;
        return res.json({
          ...safe,
          role: getUserRole(u),
          clientId: (u as any).clientId || null,
          meals: userMeals, metrics: userMetrics, medications: userMeds,
          messages: userMessages, emergencyContacts: userContacts,
          journalEntries: userJournal, waterLogs: userWater,
          goals: userGoalsList, dietaryPreference: userDietPref,
          coachingSessions: userCoaching,
          mealsCount: userMeals.length, metricsCount: userMetrics.length,
          medsCount: userMeds.length, messagesCount: userMessages.length,
        });
      }
      const u = await db!.query.users.findFirst({ where: eq(users.id, uid) });
      if (!u) return res.status(404).json({ message: "User not found" });
      const [userMeals, userMetrics, userMeds, userMessages] = await Promise.all([
        db!.select().from(meals).where(eq(meals.userId, uid)),
        db!.select().from(healthMetrics).where(eq(healthMetrics.userId, uid)),
        db!.select().from(medications).where(eq(medications.userId, uid)),
        db!.select().from(chatbotMessages).where(eq(chatbotMessages.userId, uid)),
      ]);
      const { password: _, ...safe } = u;
      res.json({
        ...safe,
        role: getUserRole(u),
        clientId: (u as any).clientId || null,
        meals: userMeals,
        metrics: userMetrics,
        medications: userMeds,
        messages: userMessages,
      });
    } catch (error) {
      console.error("Admin user detail error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // DELETE /api/admin/users/:id — delete a user
  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const uid = getRouteParam(req, "id");
      const adminId = sessionUserId(req);
      if (!uid) return res.status(400).json({ message: "User id is required" });
      if (uid === adminId) return res.status(400).json({ message: "Cannot delete yourself" });
      if (isMockMode) {
        const existed = await findUserById(uid);
        if (!existed) return res.status(404).json({ message: "User not found" });
        // Remove all user data from mocks
        mockMeals.forEach((_, k) => { if ((mockMeals.get(k) as any)?.userId === uid) mockMeals.delete(k); });
        mockHealthMetrics.forEach((_, k) => { if ((mockHealthMetrics.get(k) as any)?.userId === uid) mockHealthMetrics.delete(k); });
        mockMedications.forEach((_, k) => { if ((mockMedications.get(k) as any)?.userId === uid) mockMedications.delete(k); });
        mockEmergencyContacts.forEach((_, k) => { if (mockEmergencyContacts.get(k)?.userId === uid) mockEmergencyContacts.delete(k); });
        return res.json({ success: true });
      }
      await db!.delete(users).where(eq(users.id, uid));
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ── Admin → send message to user ──────────────────────────────────────────
  app.post("/api/admin/messages", requireAdmin, async (req: Request, res: Response) => {
    try {
      const adminId = sessionUserId(req)!;
      const { toUserId, subject, body } = req.body;
      if (!toUserId || !body?.trim()) return res.status(400).json({ message: "toUserId and body required" });
      const id = mockId("msg");
      const msg: MockAdminMessage = {
        id, toUserId, fromAdminId: adminId,
        subject: subject?.trim() || "",
        body: body.trim(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      mockAdminMessages.set(id, msg);
      saveStore();
      res.status(201).json(msg);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin → get all sent messages
  app.get("/api/admin/messages", requireAdmin, async (req: Request, res: Response) => {
    const all = Array.from(mockAdminMessages.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(all);
  });

  // Admin → delete a message
  app.delete("/api/admin/messages/:id", requireAdmin, async (req: Request, res: Response) => {
    const messageId = getRouteParam(req, "id");
    if (!messageId) return res.status(400).json({ message: "Message id is required" });
    mockAdminMessages.delete(messageId);
    saveStore();
    res.json({ success: true });
  });

  // User → get their inbox
  app.get("/api/notifications", async (req: Request, res: Response) => {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const msgs = Array.from(mockAdminMessages.values())
      .filter((m) => m.toUserId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(msgs);
  });

  // User → mark message as read
  app.put("/api/notifications/:id/read", async (req: Request, res: Response) => {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const messageId = getRouteParam(req, "id");
    if (!messageId) return res.status(400).json({ message: "Message id is required" });
    const msg = mockAdminMessages.get(messageId);
    if (!msg || msg.toUserId !== userId) return res.status(404).json({ message: "Not found" });
    const updated = { ...msg, isRead: true };
    mockAdminMessages.set(msg.id, updated);
    saveStore();
    res.json(updated);
  });

  // Runtime diagnostics endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      mode: isMockMode ? "mock" : "database",
      timestamp: new Date().toISOString(),
    });
  });

  return httpServer;
}
