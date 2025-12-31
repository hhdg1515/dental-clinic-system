// Clinic locations configuration
import type { ClinicId } from '../types';

export interface ClinicOption {
  value: ClinicId;
  label: string;
  address?: string;
  phone?: string;
}

export const CLINICS: ClinicOption[] = [
  {
    value: 'arcadia',
    label: 'Arcadia',
    address: '123 Main St, Arcadia, CA 91006',
    phone: '(626) 555-0101'
  },
  {
    value: 'irvine',
    label: 'Irvine',
    address: '456 Oak Ave, Irvine, CA 92618',
    phone: '(949) 555-0102'
  },
  {
    value: 'south-pasadena',
    label: 'South Pasadena',
    address: '789 Fair Oaks Blvd, South Pasadena, CA 91030',
    phone: '(626) 555-0103'
  },
  {
    value: 'rowland-heights',
    label: 'Rowland Heights',
    address: '321 Colima Rd, Rowland Heights, CA 91748',
    phone: '(626) 555-0104'
  },
  {
    value: 'eastvale',
    label: 'Eastvale',
    address: '654 Limonite Ave, Eastvale, CA 92880',
    phone: '(951) 555-0105'
  },
];

// Helper to get clinic by value
export const getClinicByValue = (value: ClinicId): ClinicOption | undefined => {
  return CLINICS.find(clinic => clinic.value === value);
};

// Helper to get clinic label
export const getClinicLabel = (value: ClinicId): string => {
  return getClinicByValue(value)?.label || value;
};
