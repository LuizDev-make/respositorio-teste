export type ShoppingItemStatus = 'pending' | 'in_cart' | 'bought';

export interface ShoppingItem {
  id: string;
  houseId: string;
  name: string;
  quantity: number;
  notes: string | null;
  status: ShoppingItemStatus;
  addedBy: string;
  addedAt: Date;
  lastChangedBy: string;
  lastChangedAt: Date;
  boughtAt: Date | null;
}
