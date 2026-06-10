/**
 * Organization Manager - Multi-organization support utilities
 * Handles organization creation, member management, departments, and settings
 */

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  createdBy: string;
  settings: OrganizationSettings;
  stats: OrganizationStats;
}

export interface OrganizationSettings {
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  country: string;
  timezone: string;
  language: string;
  customDomain?: string;
  enableSSO: boolean;
  enableAuditLogging: boolean;
  enableBilling: boolean;
  dataResidency?: string;
}

export interface OrganizationStats {
  totalMembers: number;
  totalDepartments: number;
  activeUsers: number;
  lastActivityAt?: string;
  storageUsedGB: number;
}

export interface Member {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  status: 'pending' | 'active' | 'inactive';
  joinedAt?: string;
  lastLoginAt?: string;
  permissions: string[];
}

export interface Department {
  id: string;
  orgId: string;
  name: string;
  description: string;
  parentDepartmentId?: string;
  managers: string[]; // user IDs
  memberCount: number;
}

export interface InvitationToken {
  token: string;
  email: string;
  orgId: string;
  role: string;
  expiresAt: string;
  createdAt: string;
}

// In-memory storage for demo purposes
const organizationsDB: Map<string, Organization> = new Map();
const membersDB: Map<string, Member[]> = new Map();
const departmentsDB: Map<string, Department[]> = new Map();
const invitationsDB: Map<string, InvitationToken> = new Map();

export class OrganizationManager {
  /**
   * Create a new organization
   */
  static createOrganization(name: string, settings: Partial<OrganizationSettings>, createdBy: string): Organization {
    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullSettings: OrganizationSettings = {
      industry: settings.industry || 'Technology',
      size: settings.size || 'medium',
      country: settings.country || 'US',
      timezone: settings.timezone || 'UTC',
      language: settings.language || 'en',
      enableSSO: settings.enableSSO ?? false,
      enableAuditLogging: settings.enableAuditLogging ?? true,
      enableBilling: settings.enableBilling ?? true,
      dataResidency: settings.dataResidency || 'US',
    };

    const organization: Organization = {
      id: orgId,
      name,
      createdAt: new Date().toISOString(),
      createdBy,
      settings: fullSettings,
      stats: {
        totalMembers: 1,
        totalDepartments: 0,
        activeUsers: 1,
        storageUsedGB: 0,
      },
    };

    organizationsDB.set(orgId, organization);

    // Add creator as member with admin role
    const member: Member = {
      id: `user_${Date.now()}`,
      orgId,
      email: createdBy,
      name: createdBy.split('@')[0],
      role: 'super-admin',
      status: 'active',
      joinedAt: new Date().toISOString(),
      permissions: ['*'], // Super admin has all permissions
    };

    membersDB.set(orgId, [member]);

    // Create default General department
    this.createDepartment(orgId, 'General', 'General department', undefined);

    return organization;
  }

  /**
   * Get organization by ID
   */
  static getOrganization(orgId: string): Organization | null {
    return organizationsDB.get(orgId) || null;
  }

  /**
   * Update organization settings
   */
  static updateOrganizationSettings(orgId: string, updates: Partial<OrganizationSettings>): Organization | null {
    const org = organizationsDB.get(orgId);
    if (!org) return null;

    org.settings = { ...org.settings, ...updates };
    org.stats.lastActivityAt = new Date().toISOString();
    organizationsDB.set(orgId, org);

    return org;
  }

  /**
   * Get organization statistics
   */
  static getOrganizationStats(orgId: string): OrganizationStats | null {
    const org = organizationsDB.get(orgId);
    if (!org) return null;

    const members = membersDB.get(orgId) || [];
    const activeMembers = members.filter(m => m.status === 'active');

    return {
      totalMembers: members.length,
      totalDepartments: (departmentsDB.get(orgId) || []).length,
      activeUsers: activeMembers.length,
      lastActivityAt: org.stats.lastActivityAt,
      storageUsedGB: org.stats.storageUsedGB,
    };
  }

  /**
   * Invite a member to organization
   */
  static inviteMember(orgId: string, email: string, role: string): InvitationToken {
    const org = organizationsDB.get(orgId);
    if (!org) throw new Error(`Organization ${orgId} not found`);

    const token = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const invitation: InvitationToken = {
      token,
      email,
      orgId,
      role,
      expiresAt,
      createdAt: new Date().toISOString(),
    };

    invitationsDB.set(token, invitation);
    org.stats.lastActivityAt = new Date().toISOString();

    return invitation;
  }

  /**
   * Accept invitation and add member
   */
  static acceptInvitation(token: string, userId: string): Member | null {
    const invitation = invitationsDB.get(token);
    if (!invitation) return null;

    const now = new Date();
    if (new Date(invitation.expiresAt) < now) {
      invitationsDB.delete(token);
      return null;
    }

    const member: Member = {
      id: userId,
      orgId: invitation.orgId,
      email: invitation.email,
      name: invitation.email.split('@')[0],
      role: invitation.role,
      status: 'active',
      joinedAt: new Date().toISOString(),
      permissions: this.getRolePermissions(invitation.role),
    };

    const members = membersDB.get(invitation.orgId) || [];
    members.push(member);
    membersDB.set(invitation.orgId, members);

    // Update org stats
    const org = organizationsDB.get(invitation.orgId);
    if (org) {
      org.stats.totalMembers = members.length;
      org.stats.activeUsers = members.filter(m => m.status === 'active').length;
      org.stats.lastActivityAt = new Date().toISOString();
    }

    invitationsDB.delete(token);

    return member;
  }

  /**
   * Get members of an organization
   */
  static getMembers(orgId: string): Member[] {
    return membersDB.get(orgId) || [];
  }

  /**
   * Get a specific member
   */
  static getMember(orgId: string, userId: string): Member | null {
    const members = membersDB.get(orgId) || [];
    return members.find(m => m.id === userId) || null;
  }

  /**
   * Remove member from organization
   */
  static removeMember(orgId: string, userId: string): boolean {
    const members = membersDB.get(orgId) || [];
    const index = members.findIndex(m => m.id === userId);

    if (index === -1) return false;

    members.splice(index, 1);
    membersDB.set(orgId, members);

    // Update org stats
    const org = organizationsDB.get(orgId);
    if (org) {
      org.stats.totalMembers = members.length;
      org.stats.activeUsers = members.filter(m => m.status === 'active').length;
      org.stats.lastActivityAt = new Date().toISOString();
    }

    return true;
  }

  /**
   * Update member role and permissions
   */
  static updateMemberRole(orgId: string, userId: string, newRole: string): Member | null {
    const members = membersDB.get(orgId) || [];
    const member = members.find(m => m.id === userId);

    if (!member) return null;

    const oldRole = member.role;
    member.role = newRole;
    member.permissions = this.getRolePermissions(newRole);

    membersDB.set(orgId, members);

    return member;
  }

  /**
   * Assign member to department
   */
  static assignDepartment(orgId: string, userId: string, departmentId: string): Member | null {
    const members = membersDB.get(orgId) || [];
    const member = members.find(m => m.id === userId);

    if (!member) return null;

    member.department = departmentId;
    membersDB.set(orgId, members);

    return member;
  }

  /**
   * Create a new department
   */
  static createDepartment(orgId: string, name: string, description: string, parentDepartmentId?: string): Department {
    const deptId = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const department: Department = {
      id: deptId,
      orgId,
      name,
      description,
      parentDepartmentId,
      managers: [],
      memberCount: 0,
    };

    const departments = departmentsDB.get(orgId) || [];
    departments.push(department);
    departmentsDB.set(orgId, departments);

    // Update org stats
    const org = organizationsDB.get(orgId);
    if (org) {
      org.stats.totalDepartments = departments.length;
      org.stats.lastActivityAt = new Date().toISOString();
    }

    return department;
  }

  /**
   * Get all departments in organization
   */
  static getDepartments(orgId: string): Department[] {
    return departmentsDB.get(orgId) || [];
  }

  /**
   * Get a specific department
   */
  static getDepartment(orgId: string, departmentId: string): Department | null {
    const departments = departmentsDB.get(orgId) || [];
    return departments.find(d => d.id === departmentId) || null;
  }

  /**
   * Get members in a department
   */
  static getDepartmentMembers(orgId: string, departmentId: string): Member[] {
    const members = membersDB.get(orgId) || [];
    return members.filter(m => m.department === departmentId);
  }

  /**
   * Get role permissions
   */
  private static getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'super-admin': ['*'],
      'admin': [
        'org:read',
        'org:write',
        'members:read',
        'members:write',
        'members:invite',
        'members:remove',
        'departments:read',
        'departments:write',
        'audit:read',
        'billing:read',
        'settings:read',
        'settings:write',
      ],
      'manager': [
        'org:read',
        'members:read',
        'members:invite',
        'departments:read',
        'departments:write',
        'audit:read',
      ],
      'member': [
        'org:read',
        'members:read',
        'departments:read',
        'audit:read',
      ],
    };

    return rolePermissions[role] || rolePermissions['member'];
  }

  /**
   * Check if user has permission
   */
  static hasPermission(orgId: string, userId: string, permission: string): boolean {
    const member = this.getMember(orgId, userId);
    if (!member) return false;

    if (member.permissions.includes('*')) return true; // Super admin
    return member.permissions.includes(permission);
  }

  /**
   * Get billing overview
   */
  static getBillingOverview(orgId: string): Record<string, any> {
    const org = organizationsDB.get(orgId);
    if (!org) return {};

    const members = membersDB.get(orgId) || [];

    return {
      orgId,
      orgName: org.name,
      plan: org.settings.size,
      totalMembers: members.length,
      monthlyPrice: this.calculateMonthlyPrice(org.settings.size),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      storageUsedGB: org.stats.storageUsedGB,
      storageQuotaGB: this.getStorageQuota(org.settings.size),
    };
  }

  /**
   * Calculate monthly price based on plan
   */
  private static calculateMonthlyPrice(size: string): number {
    const pricing: Record<string, number> = {
      small: 99,
      medium: 299,
      large: 799,
      enterprise: 2999,
    };
    return pricing[size] || 299;
  }

  /**
   * Get storage quota based on plan
   */
  private static getStorageQuota(size: string): number {
    const quotas: Record<string, number> = {
      small: 100,
      medium: 500,
      large: 2000,
      enterprise: 10000,
    };
    return quotas[size] || 500;
  }

  /**
   * Export organization data (for compliance)
   */
  static exportOrganizationData(orgId: string): Record<string, any> {
    const org = organizationsDB.get(orgId);
    if (!org) return {};

    const members = membersDB.get(orgId) || [];
    const departments = departmentsDB.get(orgId) || [];

    return {
      organization: org,
      members: members.map(m => ({
        ...m,
        lastLoginAt: m.lastLoginAt || 'Never',
      })),
      departments,
      stats: this.getOrganizationStats(orgId),
      exportedAt: new Date().toISOString(),
    };
  }
}

export default OrganizationManager;
