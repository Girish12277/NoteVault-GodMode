// Mock data removed as we now use real API endpoints for Categories, Universities and Notes.
// Keeping static data for dropdowns (Degrees, Semesters, etc.)


export const degrees = ['BSc', 'MSc', 'BCA', 'MCA', 'B.Tech', 'M.Tech'];

export const specializations: Record<string, string[]> = {
  'BSc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Electronics'],
  'MSc': ['Physics', 'Chemistry', 'Mathematics', 'Biotechnology', 'Computer Science'],
  'BCA': ['Computer Applications'],
  'MCA': ['Computer Applications'],
  'B.Tech': ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'IT'],
  'M.Tech': ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'IT'],
};

export const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
