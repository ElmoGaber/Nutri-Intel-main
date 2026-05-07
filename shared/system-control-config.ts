export type SystemRoleKey = "admin" | "doctor" | "coach" | "patient";

export interface RoleCapabilityConfig {
  canSearchAnyPatientById: boolean;
  canCustomizePatientFormulas: boolean;
  canAccessRoleDashboard: boolean;
}

export interface SystemControlConfig {
  updatedAt: string;
  branding: {
    appNameEn: string;
    appNameAr: string;
    doctorLabelEn: string;
    doctorLabelAr: string;
    coachLabelEn: string;
    coachLabelAr: string;
    patientLabelEn: string;
    patientLabelAr: string;
  };
  uiLabels: {
    adminHeaderEn: string;
    adminHeaderAr: string;
    practitionerHeaderEn: string;
    practitionerHeaderAr: string;
  };
  roleCapabilities: Record<SystemRoleKey, RoleCapabilityConfig>;
  customSettings: Record<string, unknown>;
}

export const DEFAULT_SYSTEM_CONTROL_CONFIG: SystemControlConfig = {
  updatedAt: new Date().toISOString(),
  branding: {
    appNameEn: "Nutri-Intel",
    appNameAr: "نيوتري-إنتل",
    doctorLabelEn: "Doctor",
    doctorLabelAr: "دكتور",
    coachLabelEn: "Coach",
    coachLabelAr: "كوتش",
    patientLabelEn: "Patient",
    patientLabelAr: "مريض",
  },
  uiLabels: {
    adminHeaderEn: "Admin Dashboard",
    adminHeaderAr: "لوحة تحكم المشرف",
    practitionerHeaderEn: "Practitioner Dashboard",
    practitionerHeaderAr: "لوحة الطبيب/الكوتش",
  },
  roleCapabilities: {
    admin: {
      canSearchAnyPatientById: true,
      canCustomizePatientFormulas: true,
      canAccessRoleDashboard: true,
    },
    doctor: {
      canSearchAnyPatientById: true,
      canCustomizePatientFormulas: true,
      canAccessRoleDashboard: true,
    },
    coach: {
      canSearchAnyPatientById: true,
      canCustomizePatientFormulas: true,
      canAccessRoleDashboard: true,
    },
    patient: {
      canSearchAnyPatientById: false,
      canCustomizePatientFormulas: false,
      canAccessRoleDashboard: true,
    },
  },
  customSettings: {
    notes: "Use this object for future system-level UI/data/name overrides.",
  },
};

export function createDefaultSystemControlConfig(): SystemControlConfig {
  return JSON.parse(JSON.stringify(DEFAULT_SYSTEM_CONTROL_CONFIG)) as SystemControlConfig;
}

function normalizeRoleCapability(
  current: RoleCapabilityConfig,
  incoming: unknown,
): RoleCapabilityConfig {
  const next = (incoming || {}) as Partial<RoleCapabilityConfig>;
  return {
    canSearchAnyPatientById:
      next.canSearchAnyPatientById != null
        ? Boolean(next.canSearchAnyPatientById)
        : current.canSearchAnyPatientById,
    canCustomizePatientFormulas:
      next.canCustomizePatientFormulas != null
        ? Boolean(next.canCustomizePatientFormulas)
        : current.canCustomizePatientFormulas,
    canAccessRoleDashboard:
      next.canAccessRoleDashboard != null
        ? Boolean(next.canAccessRoleDashboard)
        : current.canAccessRoleDashboard,
  };
}

export function mergeSystemControlConfig(
  current: SystemControlConfig,
  incoming: unknown,
): SystemControlConfig {
  const patch = (incoming || {}) as Partial<SystemControlConfig>;

  return {
    ...current,
    updatedAt: new Date().toISOString(),
    branding: {
      ...current.branding,
      ...(patch.branding || {}),
    },
    uiLabels: {
      ...current.uiLabels,
      ...(patch.uiLabels || {}),
    },
    roleCapabilities: {
      admin: normalizeRoleCapability(current.roleCapabilities.admin, patch.roleCapabilities?.admin),
      doctor: normalizeRoleCapability(current.roleCapabilities.doctor, patch.roleCapabilities?.doctor),
      coach: normalizeRoleCapability(current.roleCapabilities.coach, patch.roleCapabilities?.coach),
      patient: normalizeRoleCapability(current.roleCapabilities.patient, patch.roleCapabilities?.patient),
    },
    customSettings:
      patch.customSettings && typeof patch.customSettings === "object" && !Array.isArray(patch.customSettings)
        ? patch.customSettings
        : current.customSettings,
  };
}
