// Dental services configuration

export interface ServiceOption {
  value: string;
  label: string;
  labelZh?: string;
  icon?: string;
  description?: string;
  category?: 'preventive' | 'restorative' | 'cosmetic' | 'surgical' | 'orthodontic';
}

export const SERVICES: ServiceOption[] = [
  {
    value: 'general',
    label: 'General',
    labelZh: '一般检查',
    icon: 'fa-tooth',
    category: 'preventive',
    description: 'General dental examination and consultation'
  },
  {
    value: 'implant',
    label: 'Implant',
    labelZh: '种植牙',
    icon: 'fa-screwdriver-wrench',
    category: 'surgical',
    description: 'Dental implant placement and restoration'
  },
  {
    value: 'extraction',
    label: 'Extraction',
    labelZh: '拔牙',
    icon: 'fa-hand-holding-medical',
    category: 'surgical',
    description: 'Tooth extraction procedure'
  },
  {
    value: 'preventive',
    label: 'Preventive',
    labelZh: '预防保健',
    icon: 'fa-shield-heart',
    category: 'preventive',
    description: 'Cleaning, fluoride treatment, and preventive care'
  },
  {
    value: 'cosmetic',
    label: 'Cosmetic',
    labelZh: '美容牙科',
    icon: 'fa-sparkles',
    category: 'cosmetic',
    description: 'Teeth whitening, veneers, and cosmetic procedures'
  },
  {
    value: 'orthodontics',
    label: 'Orthodontics',
    labelZh: '正畸治疗',
    icon: 'fa-teeth',
    category: 'orthodontic',
    description: 'Braces, aligners, and orthodontic treatment'
  },
  {
    value: 'root-canals',
    label: 'Root Canals',
    labelZh: '根管治疗',
    icon: 'fa-wave-pulse',
    category: 'restorative',
    description: 'Root canal therapy and endodontic treatment'
  },
  {
    value: 'restorations',
    label: 'Restorations',
    labelZh: '修复治疗',
    icon: 'fa-hammer',
    category: 'restorative',
    description: 'Fillings, crowns, bridges, and dental restorations'
  },
  {
    value: 'periodontics',
    label: 'Periodontics',
    labelZh: '牙周治疗',
    icon: 'fa-teeth-open',
    category: 'preventive',
    description: 'Gum disease treatment and periodontal care'
  },
];

// Helper to get service by value
export const getServiceByValue = (value: string): ServiceOption | undefined => {
  return SERVICES.find(service => service.value === value);
};

// Helper to get service label
export const getServiceLabel = (value: string): string => {
  return getServiceByValue(value)?.label || value;
};

// Helper to get service icon
export const getServiceIcon = (value: string): string => {
  return getServiceByValue(value)?.icon || 'fa-tooth';
};

// Group services by category
export const getServicesByCategory = (category: ServiceOption['category']): ServiceOption[] => {
  return SERVICES.filter(service => service.category === category);
};
