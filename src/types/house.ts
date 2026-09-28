export interface House {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: Date;
}

export interface HouseMember {
  houseId: string;
  userId: string;
  joinedAt: Date;
  displayName: string;
  phone: string | null;
}

export interface HouseMembership {
  houseId: string;
  userId: string;
  joinedAt: Date;
}
