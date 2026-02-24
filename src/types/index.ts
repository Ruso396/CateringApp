export interface Profile {
  id: number;
  name: string;
  mobile: string;
  address: string;
  profile_image: string | null;
}

export interface Event {
  id: number;
  user_id: number;
  title: string;
  date: string | null;
  created_at?: string;
  is_deleted?: boolean;
}

export interface TableRow {
  id?: number;
  s_no: number;
  name: string;
  kg: number;
  gram: number;
  alavu: string;
}

export type ExportType = 'grocery' | 'vegetable';

export interface Dish {
  id: number;
  dish_name: string;
  created_at?: string;
}
