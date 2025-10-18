export type UserRole = "admin" | "manager" | "user"

export interface Permission {
  resource: string
  action: string
}

export const PERMISSIONS = {
  // User permissions
  USERS_LIST: { resource: "users", action: "list" },
  USERS_VIEW: { resource: "users", action: "view" },
  USERS_UPDATE: { resource: "users", action: "update" },
  USERS_DELETE: { resource: "users", action: "delete" },

  // Appointment permissions
  APPOINTMENTS_LIST_ALL: { resource: "appointments", action: "list_all" },
  APPOINTMENTS_VIEW_ALL: { resource: "appointments", action: "view_all" },
  APPOINTMENTS_COMPLETE: { resource: "appointments", action: "complete" },
  APPOINTMENTS_DELETE: { resource: "appointments", action: "delete" },
  APPOINTMENTS_SCHEDULE: { resource: "appointments", action: "schedule" },
  APPOINTMENTS_MANAGE: { resource: "appointments", action: "manage" },

  // Available dates permissions
  AVAILABLE_DATES_LIST: { resource: "available_dates", action: "list" },
  AVAILABLE_DATES_CREATE: { resource: "available_dates", action: "create" },
  AVAILABLE_DATES_UPDATE: { resource: "available_dates", action: "update" },
  AVAILABLE_DATES_DELETE: { resource: "available_dates", action: "delete" },

  // Admin permissions
  ADMIN_PANEL: { resource: "admin", action: "access" },
  ADMIN_REPORTS: { resource: "admin", action: "reports" },
  ADMIN_SETTINGS: { resource: "admin", action: "settings" },
} as const

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    PERMISSIONS.USERS_LIST,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.APPOINTMENTS_LIST_ALL,
    PERMISSIONS.APPOINTMENTS_VIEW_ALL,
    PERMISSIONS.APPOINTMENTS_COMPLETE,
    PERMISSIONS.APPOINTMENTS_DELETE,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.AVAILABLE_DATES_LIST,
    PERMISSIONS.AVAILABLE_DATES_CREATE,
    PERMISSIONS.AVAILABLE_DATES_UPDATE,
    PERMISSIONS.AVAILABLE_DATES_DELETE,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.ADMIN_REPORTS,
    PERMISSIONS.ADMIN_SETTINGS,
  ],
  manager: [
    PERMISSIONS.USERS_LIST,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.APPOINTMENTS_LIST_ALL,
    PERMISSIONS.APPOINTMENTS_VIEW_ALL,
    PERMISSIONS.APPOINTMENTS_COMPLETE,
    PERMISSIONS.APPOINTMENTS_SCHEDULE,
    PERMISSIONS.APPOINTMENTS_MANAGE,
    PERMISSIONS.AVAILABLE_DATES_LIST,
    PERMISSIONS.AVAILABLE_DATES_CREATE,
    PERMISSIONS.AVAILABLE_DATES_UPDATE,
    PERMISSIONS.AVAILABLE_DATES_DELETE,
    PERMISSIONS.ADMIN_PANEL,
    PERMISSIONS.ADMIN_REPORTS,
  ],
  user: [
    // Users can only manage their own data and appointments
  ],
}

export class PermissionService {
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.some((p) => p.resource === permission.resource && p.action === permission.action)
  }

  static canAccessAdminPanel(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.ADMIN_PANEL)
  }

  static canManageUsers(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.USERS_LIST)
  }

  static canDeleteUsers(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.USERS_DELETE)
  }

  static canViewAllAppointments(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.APPOINTMENTS_LIST_ALL)
  }

  static canCompleteAppointments(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.APPOINTMENTS_COMPLETE)
  }

  static canDeleteAppointments(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.APPOINTMENTS_DELETE)
  }

  static canAccessReports(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.ADMIN_REPORTS)
  }

  static canAccessSettings(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.ADMIN_SETTINGS)
  }

  static canScheduleAppointments(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.APPOINTMENTS_SCHEDULE)
  }

  static canManageAppointments(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.APPOINTMENTS_MANAGE)
  }

  static canManageAvailableDates(userRole: UserRole): boolean {
    return this.hasPermission(userRole, PERMISSIONS.AVAILABLE_DATES_CREATE) ||
           this.hasPermission(userRole, PERMISSIONS.AVAILABLE_DATES_UPDATE) ||
           this.hasPermission(userRole, PERMISSIONS.AVAILABLE_DATES_DELETE)
  }

  static canUpdateUser(userRole: UserRole, targetUserId: string, currentUserId: string): boolean {
    // Users can always update their own profile
    if (targetUserId === currentUserId) return true

    // Admins and managers can update other users
    return this.hasPermission(userRole, PERMISSIONS.USERS_UPDATE)
  }

  static canViewUser(userRole: UserRole, targetUserId: string, currentUserId: string): boolean {
    // Users can always view their own profile
    if (targetUserId === currentUserId) return true

    // Admins and managers can view other users
    return this.hasPermission(userRole, PERMISSIONS.USERS_VIEW)
  }
}
