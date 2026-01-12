export interface DesignerProfile {
  location: string;
  styles: string[];
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  verified: boolean;
  superVerified: boolean;
  rejectionReason?: string;
}

export interface Designer {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  designerProfile: DesignerProfile;
}
