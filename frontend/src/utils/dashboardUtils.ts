/**
 * Utility function to get dashboard URL based on user role
 * @param userRole - The user's role ('ADMIN', 'STUDENT', 'EXPERT')
 * @returns The appropriate dashboard URL
 */
export const getDashboardUrl = (userRole: string): string => {
  switch (userRole) {
    case 'ADMIN':
      return '/admin';
    case 'STUDENT':
      return '/student';
    case 'EXPERT':
      return '/expert';
    default:
      return '/dashboard';
  }
};

/**
 * Utility function to get dashboard URL from user object
 * @param user - The user object with role property
 * @returns The appropriate dashboard URL
 */
export const getDashboardUrlFromUser = (user: { role: string } | null): string => {
  if (!user) {
    return '/dashboard';
  }
  return getDashboardUrl(user.role);
};
