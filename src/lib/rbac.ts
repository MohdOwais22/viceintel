import { UserProfile, UserRole } from '../types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  Admin: 4,
  Staff: 3,
  'VIP Member': 2,
  User: 1
};

export function getRoleLevel(role?: UserRole | string): number {
  if (!role) return 1;
  return ROLE_HIERARCHY[role as UserRole] || 1;
}

export function isAdminUser(roleOrUser?: UserRole | string | { userLevel?: string; role?: string; isAdmin?: boolean; email?: string } | null, _email?: string | null): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'object') {
    if (roleOrUser.isAdmin === true) return true;
    const r = String(roleOrUser.role || '').trim().toUpperCase();
    return r === 'ADMIN';
  }
  const str = String(roleOrUser).trim().toUpperCase();
  return str === 'ADMIN';
}

export function isStaffUser(roleOrUser?: UserRole | string | { userLevel?: string; role?: string; isStaff?: boolean; email?: string } | null, email?: string | null): boolean {
  if (isAdminUser(roleOrUser, email)) return true;
  if (!roleOrUser) return false;
  if (typeof roleOrUser === 'object') {
    if (roleOrUser.isStaff === true) return true;
    const r = String(roleOrUser.role || '').trim().toUpperCase();
    return r === 'STAFF';
  }
  const str = String(roleOrUser).trim().toUpperCase();
  return str === 'STAFF';
}

export function isVipUser(role?: UserRole | string, isVipFlag?: boolean): boolean {
  if (isVipFlag === true) return true;
  return role === 'VIP Member' || role === 'Staff' || role === 'Admin';
}

/**
 * Resolves user clearance level to numeric 1-4 scale:
 * 1: L1 Citizen / Standard User
 * 2: L2 VIP Member
 * 3: L3 Staff
 * 4: L4 Admin
 * Returns 0 if user is null / guest.
 */
export function getUserClearanceLevel(user?: {
  clearanceLevel?: string | number;
  role?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
  isVip?: boolean;
} | null): number {
  if (!user) return 0;

  const cl = user.clearanceLevel;
  if (typeof cl === 'number') {
    return Math.max(1, Math.min(4, cl));
  }
  if (typeof cl === 'string') {
    const upper = cl.trim().toUpperCase();
    if (upper.startsWith('L4') || upper.includes('ADMIN')) return 4;
    if (upper.startsWith('L3') || upper.includes('STAFF')) return 3;
    if (upper.startsWith('L2') || upper.includes('VIP')) return 2;
    if (upper.startsWith('L1') || upper.includes('CITIZEN') || upper.includes('USER')) return 1;
    const parsed = parseInt(cl, 10);
    if (!isNaN(parsed)) return Math.max(1, Math.min(4, parsed));
  }

  // Fallback to role / flags
  if (user.isAdmin === true || String(user.role).toUpperCase() === 'ADMIN') return 4;
  if (user.isStaff === true || String(user.role).toUpperCase() === 'STAFF') return 3;
  if (user.isVip === true || String(user.role).toUpperCase() === 'VIP' || String(user.role).toUpperCase() === 'VIP MEMBER') return 2;
  if (user.role) return 1;

  return 1;
}

export function hasMinClearance(
  user?: {
    clearanceLevel?: string | number;
    role?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
    isVip?: boolean;
  } | null,
  minLevel: number = 2
): boolean {
  return getUserClearanceLevel(user) >= minLevel;
}

export function hasL2Clearance(
  user?: {
    clearanceLevel?: string | number;
    role?: string;
    isAdmin?: boolean;
    isStaff?: boolean;
    isVip?: boolean;
  } | null
): boolean {
  return hasMinClearance(user, 2);
}

export function getClearanceBadgeText(level: number): string {
  switch (level) {
    case 4: return 'L4 Admin';
    case 3: return 'L3 Staff';
    case 2: return 'L2 VIP';
    case 1: return 'L1 Citizen';
    default: return 'Guest';
  }
}

/**
 * Enterprise Rule:
 * Only Admin (L4) accounts are protected from suspension/banning.
 * Admins and Staff can suspend/ban any non-admin users (including VIPs and standard users).
 */
export function canBanTarget(
  actorRole: UserRole | string,
  actorEmail: string | null | undefined,
  targetRole: UserRole | string,
  targetUser?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string; email?: string } | null
): { allowed: boolean; reason?: string } {
  // Only Admin accounts are protected from being suspended/banned
  if (isTargetAdmin(targetUser) || String(targetRole).toUpperCase() === 'ADMIN' || String(targetRole).toUpperCase() === 'L4') {
    return {
      allowed: false,
      reason: 'Admin accounts are protected and cannot be suspended.'
    };
  }

  // Admins and Staff can ban/suspend non-admin users
  if (isAdminUser(actorRole, actorEmail) || isStaffUser(actorRole, actorEmail)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Insufficient moderator privileges.'
  };
}

export function isTargetAdmin(user?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string; email?: string } | null): boolean {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  const role = String(user.role || '').trim().toUpperCase();
  return role === 'ADMIN';
}

/**
  * Enterprise Rule:
  * Only Level 4 Admins can edit fields on Admin (L4) accounts.
  * Staff (L3) members can edit fields on non-Admin user profiles.
  */
export function canEditUserFields(
  actorRole: UserRole | string,
  actorEmail: string | null | undefined,
  targetUser?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string; email?: string } | null
): boolean {
  if (isTargetAdmin(targetUser)) {
    return isAdminUser(actorRole, actorEmail);
  }
  return isAdminUser(actorRole, actorEmail) || isStaffUser(actorRole, actorEmail);
}

/**
 * Enterprise Rule:
 * Admins (L4) can assign any role to any user.
 * Staff (L3) can change anyone's role EXCEPT Admin (L4) accounts, and cannot assign/promote to Admin (L4).
 */
export function canAssignRole(
  actorRole: UserRole | string,
  actorEmail: string | null | undefined,
  targetRole?: UserRole | string,
  newRole?: UserRole | string,
  targetUser?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string } | null
): boolean {
  if (isTargetAdmin(targetUser) || targetRole === 'Admin' || targetRole === 'L4') {
    return isAdminUser(actorRole, actorEmail);
  }
  if (newRole === 'Admin' || newRole === 'L4') {
    return isAdminUser(actorRole, actorEmail);
  }
  return isStaffUser(actorRole, actorEmail);
}
