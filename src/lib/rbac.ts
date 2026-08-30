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

export function isAdminUser(role?: UserRole | string, _email?: string | null): boolean {
  return role === 'Admin' || role === 'L4';
}

export function isStaffUser(role?: UserRole | string, email?: string | null): boolean {
  if (isAdminUser(role, email)) return true;
  return role === 'Staff' || role === 'L3';
}

export function isVipUser(role?: UserRole | string, isVipFlag?: boolean): boolean {
  if (isVipFlag === true) return true;
  return role === 'VIP Member' || role === 'Staff' || role === 'Admin';
}

/**
 * Enterprise Rule:
 * Staff (L3) members can ban or suspend any user except Admin (L4) accounts.
 * Admins (L4) can ban or suspend any account.
 */
export function canBanTarget(
  actorRole: UserRole | string,
  actorEmail: string | null | undefined,
  targetRole: UserRole | string,
  targetUser?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string } | null
): { allowed: boolean; reason?: string } {
  if (isAdminUser(actorRole, actorEmail)) {
    return { allowed: true };
  }

  if (isStaffUser(actorRole, actorEmail)) {
    if (isTargetAdmin(targetUser) || targetRole === 'Admin' || targetRole === 'L4') {
      return {
        allowed: false,
        reason: 'Staff members cannot suspend or ban Level 4 Admin accounts.'
      };
    }
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Insufficient moderator privileges.'
  };
}

export function isTargetAdmin(user?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'Admin' || user.isAdmin === true || user.clearanceLevel === 'L4' || user.userLevel === 'L4';
}

/**
  * Enterprise Rule:
  * Only Level 4 Admins can edit fields on Admin (L4) accounts.
  * Staff (L3) members can edit fields on non-Admin user profiles.
  */
export function canEditUserFields(
  actorRole: UserRole | string,
  actorEmail: string | null | undefined,
  targetUser?: { role?: string; isAdmin?: boolean; clearanceLevel?: string; userLevel?: string } | null
): boolean {
  if (isTargetAdmin(targetUser)) {
    return isAdminUser(actorRole, actorEmail);
  }
  return isStaffUser(actorRole, actorEmail);
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
