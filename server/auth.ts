import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users } from "@shared/schema";
import { mockUsers, saveStore, type MockUser } from "./mock-persist";

export type { MockUser };
export type UserRole = "admin" | "doctor" | "coach" | "patient";

export const isMockMode = !db;

function generateClientId(): string {
  return `PT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByUsername(username: string) {
  if (isMockMode) {
    return Array.from(mockUsers.values()).find((u) => u.username === username);
  }
  return db!.query.users.findFirst({ where: eq(users.username, username) });
}

export async function createUser(
  username: string,
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  age?: number,
  height?: number,
  weight?: number,
  bloodType?: string,
  isAdmin = false,
  role: UserRole = isAdmin ? "admin" : "patient",
  clientId?: string
) {
  const hashedPassword = await hashPassword(password);
  const normalizedRole: UserRole = isAdmin ? "admin" : role;
  const resolvedClientId = clientId || (normalizedRole === "patient" ? generateClientId() : undefined);
  const now = new Date();
  const trialEnds = new Date(now);
  trialEnds.setDate(trialEnds.getDate() + 15);
  const isStaff = normalizedRole === "admin" || normalizedRole === "doctor" || normalizedRole === "coach";
  const subscriptionStatus = isStaff ? "active" : "trial";
  const subscriptionPlan = isStaff ? "staff" : "trial_15";
  const subscriptionEndsAt = isStaff ? undefined : trialEnds.toISOString();
  const trialStartedAt = isStaff ? undefined : now.toISOString();
  const trialEndsAt = isStaff ? undefined : trialEnds.toISOString();
  const subscriptionStartedAt = isStaff ? now.toISOString() : undefined;

  if (isMockMode) {
    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const createdAt = now.toISOString();
    const newUser: MockUser = {
      id, username, email, password: hashedPassword,
      firstName, lastName, age, height, weight, bloodType,
      isAdmin, role: normalizedRole, clientId: resolvedClientId, onboardingCompleted: false,
      subscriptionStatus, subscriptionPlan, subscriptionEndsAt, trialStartedAt, trialEndsAt, subscriptionStartedAt,
      createdAt: createdAt, updatedAt: createdAt,
    };
    mockUsers.set(id, newUser);
    saveStore();
    return newUser;
  }

  const result = await db!.insert(users).values({
    username, email, password: hashedPassword,
    firstName, lastName, age,
    height: height?.toString(),
    weight: weight?.toString(),
    bloodType,
    isAdmin,
    role: normalizedRole,
    clientId: resolvedClientId,
    subscriptionStatus,
    subscriptionPlan,
    subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
    trialStartedAt: trialStartedAt ? new Date(trialStartedAt) : null,
    trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : null,
    subscriptionStartedAt: subscriptionStartedAt ? new Date(subscriptionStartedAt) : null,
  }).returning();
  return result[0];
}

export async function updateUser(userId: string, updates: Partial<MockUser>) {
  if (isMockMode) {
    const user = mockUsers.get(userId);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    mockUsers.set(userId, updated);
    saveStore();
    return updated;
  }
  const result = await db!.update(users).set(updates as any).where(eq(users.id, userId)).returning();
  return result[0];
}

export async function findUserById(userId: string) {
  if (isMockMode) return mockUsers.get(userId);
  return db!.query.users.findFirst({ where: eq(users.id, userId) });
}

export async function findUserByEmail(email: string) {
  if (isMockMode) return Array.from(mockUsers.values()).find((u) => u.email === email);
  return db!.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getAllUsers() {
  if (isMockMode) return Array.from(mockUsers.values());
  return db!.select().from(users);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  if (isMockMode) return { isValid: true, errors: [] };
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters");
  if (!/[a-z]/.test(password)) errors.push("Password must contain lowercase letters");
  if (!/[A-Z]/.test(password)) errors.push("Password must contain uppercase letters");
  if (!/\d/.test(password)) errors.push("Password must contain numbers");
  if (!/[^a-zA-Z\d]/.test(password)) errors.push("Password must contain special characters");
  return { isValid: errors.length === 0, errors };
}

declare global {
  namespace Express {
    interface Session { userId?: string; }
  }
}
