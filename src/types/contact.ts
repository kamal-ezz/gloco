export type EmergencyContact = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  created_at: string;
};

export type EmergencyContactInsert = {
  user_id: string;
  name: string;
  phone: string;
};

export type EmergencyContactUpdate = Partial<Omit<EmergencyContactInsert, 'user_id'>>;
