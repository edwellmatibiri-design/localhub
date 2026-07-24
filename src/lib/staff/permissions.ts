export type StaffRole = "owner" | "manager" | "team_lead" | "worker" | "viewer";

export type PermissionFlags = {
  bookings?: boolean;
  quotes?: boolean;
  crm?: boolean;
  financial?: boolean;
  jobSheets?: boolean;
  assignedJobsOnly?: boolean;
  readOnly?: boolean;
  staffManagement?: boolean;
  adminAccess?: boolean;
};

const ROLE_DEFAULTS: Record<StaffRole, PermissionFlags> = {
  owner: {
    bookings: true,
    quotes: true,
    crm: true,
    financial: true,
    jobSheets: true,
    assignedJobsOnly: false,
    readOnly: false,
    staffManagement: true,
    adminAccess: true,
  },
  manager: {
    bookings: true,
    quotes: true,
    crm: true,
    financial: true,
    jobSheets: true,
    assignedJobsOnly: false,
    readOnly: false,
    staffManagement: true,
    adminAccess: false,
  },
  team_lead: {
    bookings: true,
    quotes: false,
    crm: true,
    financial: false,
    jobSheets: true,
    assignedJobsOnly: false,
    readOnly: false,
    staffManagement: false,
    adminAccess: false,
  },
  worker: {
    bookings: false,
    quotes: false,
    crm: false,
    financial: false,
    jobSheets: true,
    assignedJobsOnly: true,
    readOnly: false,
    staffManagement: false,
    adminAccess: false,
  },
  viewer: {
    bookings: false,
    quotes: false,
    crm: false,
    financial: false,
    jobSheets: false,
    assignedJobsOnly: true,
    readOnly: true,
    staffManagement: false,
    adminAccess: false,
  },
};

export function getDefaultPermissions(role: StaffRole): PermissionFlags {
  return { ...ROLE_DEFAULTS[role] };
}

export function resolvePermissions(
  role: StaffRole,
  overrides?: PermissionFlags | null,
): PermissionFlags {
  return {
    ...getDefaultPermissions(role),
    ...(overrides ?? {}),
  };
}

export function canAccess(
  permissionSet: PermissionFlags,
  key: keyof PermissionFlags,
) {
  if (permissionSet.readOnly && key !== "readOnly") {
    return false;
  }
  return Boolean(permissionSet[key]);
}
