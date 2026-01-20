// Admin Endpoints
export const ADMIN_ENDPOINTS = {
  stats: '/admin/stats',
  pendingDesigners: '/admin/designers?status=pending',
  allDesigners: '/admin/designers',
  approveDesigner: (id: string) => `/admin/designers/${id}/approve`,
  rejectDesigner: (id: string) => `/admin/designers/${id}/reject`,
  suspendDesigner: (id: string) => `/admin/designers/${id}/suspend`,
  verifyDesigner: (id: string) => `/admin/designers/${id}/verify`,
  superVerifyDesigner: (id: string) => `/admin/designers/${id}/super-verify`,
  users: '/admin/users',
  banUser: (id: string) => `/admin/users/${id}/ban`,
  projects: '/admin/projects',
  deleteProject: (id: string) => `/admin/projects/${id}`,
};

// Upload Endpoints
export const UPLOAD_ENDPOINTS = {
  projectImages: '/upload/project-images',
  portfolioImages: '/upload/portfolio-images',
  profileImage: '/upload/profile-images',
  designerApplication: '/upload/designer-apply',
};

// Public Designer Endpoints
export const DESIGNER_ENDPOINTS = {
  list: '/designers',
  single: (id: string) => `/designers/${id}`,
};

// Project Endpoints
export const PROJECT_ENDPOINTS = {
  list: '/projects',
  adminList: '/projects/admin',
  single: (id: string) => `/projects/${id}`,
  create: '/projects',
};