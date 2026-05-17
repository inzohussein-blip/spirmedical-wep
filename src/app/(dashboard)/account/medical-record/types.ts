export interface MedicalInfo {
  blood_type?: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  birth_date?: string | null;
  chronic_conditions: Array<{ name: string; since: string; severity: 'mild' | 'moderate' | 'severe' }>;
  allergies: Array<{ name: string; reaction: string }>;
  past_surgeries: Array<{ name: string; date: string; hospital: string }>;
  family_history: Array<{ condition: string; relation: string }>;
}

export const EMPTY_MEDICAL_INFO: MedicalInfo = {
  blood_type: '',
  height_cm: null,
  weight_kg: null,
  birth_date: null,
  chronic_conditions: [],
  allergies: [],
  past_surgeries: [],
  family_history: [],
};
