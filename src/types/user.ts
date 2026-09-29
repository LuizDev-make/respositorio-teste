export interface User {
  uid: string;
  displayName: string;
  email: string;
  phone: string | null;
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  phone: string | null;
}
