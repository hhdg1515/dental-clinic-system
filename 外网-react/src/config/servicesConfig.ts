import type { TranslationKey } from '../context/LanguageContext';

export interface ProcessStep {
  numberKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl: string;
}

export interface PricingPackage {
  nameKey: TranslationKey;
  price: string;
  priceNoteKey?: TranslationKey;
  featuresKeys: TranslationKey[];
  featured?: boolean;
}

export interface ServiceConfig {
  slug: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;

  // Overview Section
  overviewTitleKey: TranslationKey;
  overviewParagraphs: TranslationKey[];
  overviewHighlightKey: TranslationKey;
  overviewImage: string;
  overviewImageAltKey: TranslationKey;

  // Process Steps
  processTitleKey: TranslationKey;
  processSubtitleKey: TranslationKey;
  processSteps: ProcessStep[];

  // Ideal Candidates
  candidatesTitleKey: TranslationKey;
  candidatesIntroKey: TranslationKey;
  candidatesKeys: TranslationKey[];

  // FAQ
  faqTitleKey: TranslationKey;
  faqSubtitleKey: TranslationKey;
  faqKeys: Array<{ questionKey: TranslationKey; answerKey: TranslationKey }>;

  // Pricing
  pricingTitleKey: TranslationKey;
  pricingPackages: PricingPackage[];
}

export const servicesConfig: Record<string, ServiceConfig> = {
  'general-family': {
    slug: 'general-family',
    titleKey: 'general-service-title',
    subtitleKey: 'general-service-subtitle',
    seoTitle: 'General & Family Dentistry | First Ave Dental',
    seoDescription: '家庭牙科服务：定期检查、洗牙、补牙、拔牙等基础牙科护理。提供温和、专业的家庭式牙科服务，适合全家人。',
    seoKeywords: '家庭牙科, 综合牙科, 定期检查, 洗牙, 补牙, 预防性护理',

    overviewTitleKey: 'general-overview-title',
    overviewParagraphs: ['general-overview-p1', 'general-overview-p2', 'general-overview-p3'],
    overviewHighlightKey: 'general-overview-highlight',
    overviewImage: '/images/family.jpg',
    overviewImageAltKey: 'general-card-title',

    processTitleKey: 'general-process-title',
    processSubtitleKey: 'general-process-subtitle',
    processSteps: [
      {
        numberKey: 'general-process-step1-num',
        titleKey: 'general-process-step1-title',
        descriptionKey: 'general-process-step1-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'general-process-step2-num',
        titleKey: 'general-process-step2-title',
        descriptionKey: 'general-process-step2-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'general-process-step3-num',
        titleKey: 'general-process-step3-title',
        descriptionKey: 'general-process-step3-desc',
        imageUrl: '/images/or.jpg'
      },
      {
        numberKey: 'general-process-step4-num',
        titleKey: 'general-process-step4-title',
        descriptionKey: 'general-process-step4-desc',
        imageUrl: '/images/ro.jpg'
      }
    ],

    candidatesTitleKey: 'general-candidates-title',
    candidatesIntroKey: 'general-candidates-intro',
    candidatesKeys: [
      'general-candidate1',
      'general-candidate2',
      'general-candidate3',
      'general-candidate4',
      'general-candidate5',
      'general-candidate6'
    ],

    faqTitleKey: 'general-faq-title',
    faqSubtitleKey: 'general-faq-subtitle',
    faqKeys: [
      { questionKey: 'general-faq1-q', answerKey: 'general-faq1-a' },
      { questionKey: 'general-faq2-q', answerKey: 'general-faq2-a' },
      { questionKey: 'general-faq3-q', answerKey: 'general-faq3-a' },
      { questionKey: 'general-faq4-q', answerKey: 'general-faq4-a' },
      { questionKey: 'general-faq5-q', answerKey: 'general-faq5-a' },
      { questionKey: 'general-faq6-q', answerKey: 'general-faq6-a' },
      { questionKey: 'general-faq7-q', answerKey: 'general-faq7-a' },
      { questionKey: 'general-faq8-q', answerKey: 'general-faq8-a' },
      { questionKey: 'general-faq9-q', answerKey: 'general-faq9-a' },
      { questionKey: 'general-faq10-q', answerKey: 'general-faq10-a' },
      { questionKey: 'general-faq11-q', answerKey: 'general-faq11-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'general-package-1-name',
        price: '$150 - $300',
        featuresKeys: ['general-package-1-item1', 'general-package-1-item2', 'general-package-1-item3']
      },
      {
        nameKey: 'general-package-2-name',
        price: '$500 - $800',
        featuresKeys: ['general-package-2-item1', 'general-package-2-item2', 'general-package-2-item3'],
        featured: true
      },
      {
        nameKey: 'general-package-3-name',
        price: '$1,200',
        featuresKeys: ['general-package-3-item1', 'general-package-3-item2', 'general-package-3-item3']
      }
    ]
  },

  'cosmetic': {
    slug: 'cosmetic',
    titleKey: 'cosmetic-service-title',
    subtitleKey: 'cosmetic-service-subtitle',
    seoTitle: 'Cosmetic Dentistry | First Ave Dental',
    seoDescription: '美容牙科服务：牙齿美白、贴面、美学修复。让您拥有自信迷人的笑容。',
    seoKeywords: '美容牙科, 牙齿美白, 牙贴面, 美学修复, 笑容设计',

    overviewTitleKey: 'cosmetic-overview-title',
    overviewParagraphs: ['cosmetic-overview-p1', 'cosmetic-overview-p2', 'cosmetic-overview-p3'],
    overviewHighlightKey: 'cosmetic-overview-highlight',
    overviewImage: '/images/cosmetic.jpg',
    overviewImageAltKey: 'cosmetic-card-title',

    processTitleKey: 'cosmetic-process-title',
    processSubtitleKey: 'cosmetic-process-subtitle',
    processSteps: [
      {
        numberKey: 'cosmetic-process-step1-num',
        titleKey: 'cosmetic-process-step1-title',
        descriptionKey: 'cosmetic-process-step1-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'cosmetic-process-step2-num',
        titleKey: 'cosmetic-process-step2-title',
        descriptionKey: 'cosmetic-process-step2-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'cosmetic-process-step3-num',
        titleKey: 'cosmetic-process-step3-title',
        descriptionKey: 'cosmetic-process-step3-desc',
        imageUrl: '/images/or.jpg'
      },
      {
        numberKey: 'cosmetic-process-step4-num',
        titleKey: 'cosmetic-process-step4-title',
        descriptionKey: 'cosmetic-process-step4-desc',
        imageUrl: '/images/ro.jpg'
      }
    ],

    candidatesTitleKey: 'cosmetic-candidates-title',
    candidatesIntroKey: 'cosmetic-candidates-intro',
    candidatesKeys: [
      'cosmetic-candidate1',
      'cosmetic-candidate2',
      'cosmetic-candidate3',
      'cosmetic-candidate4',
      'cosmetic-candidate5',
      'cosmetic-candidate6'
    ],

    faqTitleKey: 'cosmetic-faq-title',
    faqSubtitleKey: 'cosmetic-faq-subtitle',
    faqKeys: [
      { questionKey: 'cosmetic-faq1-q', answerKey: 'cosmetic-faq1-a' },
      { questionKey: 'cosmetic-faq2-q', answerKey: 'cosmetic-faq2-a' },
      { questionKey: 'cosmetic-faq3-q', answerKey: 'cosmetic-faq3-a' },
      { questionKey: 'cosmetic-faq4-q', answerKey: 'cosmetic-faq4-a' },
      { questionKey: 'cosmetic-faq5-q', answerKey: 'cosmetic-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'cosmetic-package-1-name',
        price: '$300 - $600',
        featuresKeys: ['cosmetic-package-1-item1', 'cosmetic-package-1-item2', 'cosmetic-package-1-item3']
      },
      {
        nameKey: 'cosmetic-package-2-name',
        price: '$800 - $1,500',
        priceNoteKey: 'per-tooth',
        featuresKeys: ['cosmetic-package-2-item1', 'cosmetic-package-2-item2', 'cosmetic-package-2-item3', 'cosmetic-package-2-item4'],
        featured: true
      },
      {
        nameKey: 'cosmetic-package-3-name',
        price: '$3,000+',
        featuresKeys: ['cosmetic-package-3-item1', 'cosmetic-package-3-item2', 'cosmetic-package-3-item3']
      }
    ]
  },

  'orthodontics': {
    slug: 'orthodontics',
    titleKey: 'orthodontics-service-title',
    subtitleKey: 'orthodontics-service-subtitle',
    seoTitle: 'Orthodontics | First Ave Dental',
    seoDescription: '正畸服务：传统牙套、隐形矫正、青少年和成人正畸治疗。',
    seoKeywords: '正畸, 牙套, 隐形矫正, Invisalign, 牙齿矫正',

    overviewTitleKey: 'orthodontics-overview-title',
    overviewParagraphs: ['orthodontics-overview-p1', 'orthodontics-overview-p2', 'orthodontics-overview-p3'],
    overviewHighlightKey: 'orthodontics-overview-highlight',
    overviewImage: '/images/or.jpg',
    overviewImageAltKey: 'orthodontics-card-title',

    processTitleKey: 'orthodontics-process-title',
    processSubtitleKey: 'orthodontics-process-subtitle',
    processSteps: [
      {
        numberKey: 'orthodontics-process-step1-num',
        titleKey: 'orthodontics-process-step1-title',
        descriptionKey: 'orthodontics-process-step1-desc',
        imageUrl: '/images/or.jpg'
      },
      {
        numberKey: 'orthodontics-process-step2-num',
        titleKey: 'orthodontics-process-step2-title',
        descriptionKey: 'orthodontics-process-step2-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'orthodontics-process-step3-num',
        titleKey: 'orthodontics-process-step3-title',
        descriptionKey: 'orthodontics-process-step3-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'orthodontics-process-step4-num',
        titleKey: 'orthodontics-process-step4-title',
        descriptionKey: 'orthodontics-process-step4-desc',
        imageUrl: '/images/ro.jpg'
      }
    ],

    candidatesTitleKey: 'orthodontics-candidates-title',
    candidatesIntroKey: 'orthodontics-candidates-intro',
    candidatesKeys: [
      'orthodontics-candidate1',
      'orthodontics-candidate2',
      'orthodontics-candidate3',
      'orthodontics-candidate4',
      'orthodontics-candidate5',
      'orthodontics-candidate6'
    ],

    faqTitleKey: 'orthodontics-faq-title',
    faqSubtitleKey: 'orthodontics-faq-subtitle',
    faqKeys: [
      { questionKey: 'orthodontics-faq1-q', answerKey: 'orthodontics-faq1-a' },
      { questionKey: 'orthodontics-faq2-q', answerKey: 'orthodontics-faq2-a' },
      { questionKey: 'orthodontics-faq3-q', answerKey: 'orthodontics-faq3-a' },
      { questionKey: 'orthodontics-faq4-q', answerKey: 'orthodontics-faq4-a' },
      { questionKey: 'orthodontics-faq5-q', answerKey: 'orthodontics-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'orthodontics-package-1-name',
        price: '$3,500 - $5,500',
        featuresKeys: ['orthodontics-package-1-item1', 'orthodontics-package-1-item2', 'orthodontics-package-1-item3']
      },
      {
        nameKey: 'orthodontics-package-2-name',
        price: '$4,500 - $7,000',
        featuresKeys: ['orthodontics-package-2-item1', 'orthodontics-package-2-item2', 'orthodontics-package-2-item3', 'orthodontics-package-2-item4'],
        featured: true
      },
      {
        nameKey: 'orthodontics-package-3-name',
        price: 'flexible-payment',
        featuresKeys: ['orthodontics-package-3-item1', 'orthodontics-package-3-item2', 'orthodontics-package-3-item3']
      }
    ]
  },

  'root-canals': {
    slug: 'root-canals',
    titleKey: 'rootcanal-service-title',
    subtitleKey: 'rootcanal-service-subtitle',
    seoTitle: 'Root Canal Therapy | First Ave Dental',
    seoDescription: '根管治疗：专业、无痛的根管治疗服务，保存您的天然牙齿。',
    seoKeywords: '根管治疗, 牙髓治疗, 牙齿保存, 牙痛治疗',

    overviewTitleKey: 'rootcanal-overview-title',
    overviewParagraphs: ['rootcanal-overview-p1', 'rootcanal-overview-p2', 'rootcanal-overview-p3'],
    overviewHighlightKey: 'rootcanal-overview-highlight',
    overviewImage: '/images/ro.jpg',
    overviewImageAltKey: 'rootcanal-card-title',

    processTitleKey: 'rootcanal-process-title',
    processSubtitleKey: 'rootcanal-process-subtitle',
    processSteps: [
      {
        numberKey: 'rootcanal-process-step1-num',
        titleKey: 'rootcanal-process-step1-title',
        descriptionKey: 'rootcanal-process-step1-desc',
        imageUrl: '/images/ro.jpg'
      },
      {
        numberKey: 'rootcanal-process-step2-num',
        titleKey: 'rootcanal-process-step2-title',
        descriptionKey: 'rootcanal-process-step2-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'rootcanal-process-step3-num',
        titleKey: 'rootcanal-process-step3-title',
        descriptionKey: 'rootcanal-process-step3-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'rootcanal-process-step4-num',
        titleKey: 'rootcanal-process-step4-title',
        descriptionKey: 'rootcanal-process-step4-desc',
        imageUrl: '/images/or.jpg'
      }
    ],

    candidatesTitleKey: 'rootcanal-candidates-title',
    candidatesIntroKey: 'rootcanal-candidates-intro',
    candidatesKeys: [
      'rootcanal-candidate1',
      'rootcanal-candidate2',
      'rootcanal-candidate3',
      'rootcanal-candidate4',
      'rootcanal-candidate5',
      'rootcanal-candidate6'
    ],

    faqTitleKey: 'rootcanal-faq-title',
    faqSubtitleKey: 'rootcanal-faq-subtitle',
    faqKeys: [
      { questionKey: 'rootcanal-faq1-q', answerKey: 'rootcanal-faq1-a' },
      { questionKey: 'rootcanal-faq2-q', answerKey: 'rootcanal-faq2-a' },
      { questionKey: 'rootcanal-faq3-q', answerKey: 'rootcanal-faq3-a' },
      { questionKey: 'rootcanal-faq4-q', answerKey: 'rootcanal-faq4-a' },
      { questionKey: 'rootcanal-faq5-q', answerKey: 'rootcanal-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'rootcanal-package-1-name',
        price: '$600 - $900',
        featuresKeys: ['rootcanal-package-1-item1', 'rootcanal-package-1-item2', 'rootcanal-package-1-item3']
      },
      {
        nameKey: 'rootcanal-package-2-name',
        price: '$900 - $1,500',
        featuresKeys: ['rootcanal-package-2-item1', 'rootcanal-package-2-item2', 'rootcanal-package-2-item3', 'rootcanal-package-2-item4'],
        featured: true
      },
      {
        nameKey: 'rootcanal-package-3-name',
        price: '$1,500 - $2,500',
        featuresKeys: ['rootcanal-package-3-item1', 'rootcanal-package-3-item2', 'rootcanal-package-3-item3']
      }
    ]
  },

  'periodontics': {
    slug: 'periodontics',
    titleKey: 'periodontics-service-title',
    subtitleKey: 'periodontics-service-subtitle',
    seoTitle: 'Periodontics | First Ave Dental',
    seoDescription: '牙周病治疗：深度洁牙、牙龈治疗、牙周病管理。',
    seoKeywords: '牙周病, 牙龈治疗, 深度洁牙, 牙周炎, 牙龈炎',

    overviewTitleKey: 'periodontics-overview-title',
    overviewParagraphs: ['periodontics-overview-p1', 'periodontics-overview-p2', 'periodontics-overview-p3'],
    overviewHighlightKey: 'periodontics-overview-highlight',
    overviewImage: '/images/pe.jpg',
    overviewImageAltKey: 'periodontics-card-title',

    processTitleKey: 'periodontics-process-title',
    processSubtitleKey: 'periodontics-process-subtitle',
    processSteps: [
      {
        numberKey: 'periodontics-process-step1-num',
        titleKey: 'periodontics-process-step1-title',
        descriptionKey: 'periodontics-process-step1-desc',
        imageUrl: '/images/pe.jpg'
      },
      {
        numberKey: 'periodontics-process-step2-num',
        titleKey: 'periodontics-process-step2-title',
        descriptionKey: 'periodontics-process-step2-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'periodontics-process-step3-num',
        titleKey: 'periodontics-process-step3-title',
        descriptionKey: 'periodontics-process-step3-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'periodontics-process-step4-num',
        titleKey: 'periodontics-process-step4-title',
        descriptionKey: 'periodontics-process-step4-desc',
        imageUrl: '/images/or.jpg'
      }
    ],

    candidatesTitleKey: 'periodontics-candidates-title',
    candidatesIntroKey: 'periodontics-candidates-intro',
    candidatesKeys: [
      'periodontics-candidate1',
      'periodontics-candidate2',
      'periodontics-candidate3',
      'periodontics-candidate4',
      'periodontics-candidate5',
      'periodontics-candidate6'
    ],

    faqTitleKey: 'periodontics-faq-title',
    faqSubtitleKey: 'periodontics-faq-subtitle',
    faqKeys: [
      { questionKey: 'periodontics-faq1-q', answerKey: 'periodontics-faq1-a' },
      { questionKey: 'periodontics-faq2-q', answerKey: 'periodontics-faq2-a' },
      { questionKey: 'periodontics-faq3-q', answerKey: 'periodontics-faq3-a' },
      { questionKey: 'periodontics-faq4-q', answerKey: 'periodontics-faq4-a' },
      { questionKey: 'periodontics-faq5-q', answerKey: 'periodontics-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'periodontics-package-1-name',
        price: '$200 - $400',
        priceNoteKey: 'per-quadrant',
        featuresKeys: ['periodontics-package-1-item1', 'periodontics-package-1-item2', 'periodontics-package-1-item3']
      },
      {
        nameKey: 'periodontics-package-2-name',
        price: '$800 - $1,600',
        featuresKeys: ['periodontics-package-2-item1', 'periodontics-package-2-item2', 'periodontics-package-2-item3'],
        featured: true
      },
      {
        nameKey: 'periodontics-package-3-name',
        price: '$2,000+',
        featuresKeys: ['periodontics-package-3-item1', 'periodontics-package-3-item2', 'periodontics-package-3-item3']
      }
    ]
  },

  'restorations': {
    slug: 'restorations',
    titleKey: 'restorations-service-title',
    subtitleKey: 'restorations-service-subtitle',
    seoTitle: 'Dental Restorations | First Ave Dental',
    seoDescription: '牙齿修复：牙冠、牙桥、种植牙、镶牙等全面修复服务。',
    seoKeywords: '牙齿修复, 牙冠, 牙桥, 种植牙, 镶牙',

    overviewTitleKey: 'restorations-overview-title',
    overviewParagraphs: ['restorations-overview-p1', 'restorations-overview-p2', 'restorations-overview-p3'],
    overviewHighlightKey: 'restorations-overview-highlight',
    overviewImage: '/images/res.jpg',
    overviewImageAltKey: 'restorations-card-title',

    processTitleKey: 'restorations-process-title',
    processSubtitleKey: 'restorations-process-subtitle',
    processSteps: [
      {
        numberKey: 'restorations-process-step1-num',
        titleKey: 'restorations-process-step1-title',
        descriptionKey: 'restorations-process-step1-desc',
        imageUrl: '/images/res.jpg'
      },
      {
        numberKey: 'restorations-process-step2-num',
        titleKey: 'restorations-process-step2-title',
        descriptionKey: 'restorations-process-step2-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'restorations-process-step3-num',
        titleKey: 'restorations-process-step3-title',
        descriptionKey: 'restorations-process-step3-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'restorations-process-step4-num',
        titleKey: 'restorations-process-step4-title',
        descriptionKey: 'restorations-process-step4-desc',
        imageUrl: '/images/or.jpg'
      }
    ],

    candidatesTitleKey: 'restorations-candidates-title',
    candidatesIntroKey: 'restorations-candidates-intro',
    candidatesKeys: [
      'restorations-candidate1',
      'restorations-candidate2',
      'restorations-candidate3',
      'restorations-candidate4',
      'restorations-candidate5',
      'restorations-candidate6'
    ],

    faqTitleKey: 'restorations-faq-title',
    faqSubtitleKey: 'restorations-faq-subtitle',
    faqKeys: [
      { questionKey: 'restorations-faq1-q', answerKey: 'restorations-faq1-a' },
      { questionKey: 'restorations-faq2-q', answerKey: 'restorations-faq2-a' },
      { questionKey: 'restorations-faq3-q', answerKey: 'restorations-faq3-a' },
      { questionKey: 'restorations-faq4-q', answerKey: 'restorations-faq4-a' },
      { questionKey: 'restorations-faq5-q', answerKey: 'restorations-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'restorations-package-1-name',
        price: '$800 - $1,500',
        priceNoteKey: 'per-tooth',
        featuresKeys: ['restorations-package-1-item1', 'restorations-package-1-item2', 'restorations-package-1-item3']
      },
      {
        nameKey: 'restorations-package-2-name',
        price: '$2,000 - $5,000',
        priceNoteKey: 'per-tooth',
        featuresKeys: ['restorations-package-2-item1', 'restorations-package-2-item2', 'restorations-package-2-item3'],
        featured: true
      },
      {
        nameKey: 'restorations-package-3-name',
        price: '$1,200 - $2,500',
        featuresKeys: ['restorations-package-3-item1', 'restorations-package-3-item2', 'restorations-package-3-item3']
      }
    ]
  },

  'preventive': {
    slug: 'preventive',
    titleKey: 'preventive-service-title',
    subtitleKey: 'preventive-service-subtitle',
    seoTitle: 'Preventive Care | First Ave Dental',
    seoDescription: '预防性护理：氟化物治疗、窝沟封闭、口腔健康教育。',
    seoKeywords: '预防性护理, 氟化物, 窝沟封闭, 口腔卫生, 预防蛀牙',

    overviewTitleKey: 'preventive-overview-title',
    overviewParagraphs: ['preventive-overview-p1', 'preventive-overview-p2', 'preventive-overview-p3'],
    overviewHighlightKey: 'preventive-overview-highlight',
    overviewImage: '/images/preventive.png',
    overviewImageAltKey: 'preventive-card-title',

    processTitleKey: 'preventive-process-title',
    processSubtitleKey: 'preventive-process-subtitle',
    processSteps: [
      {
        numberKey: 'preventive-process-step1-num',
        titleKey: 'preventive-process-step1-title',
        descriptionKey: 'preventive-process-step1-desc',
        imageUrl: '/images/preventive.png'
      },
      {
        numberKey: 'preventive-process-step2-num',
        titleKey: 'preventive-process-step2-title',
        descriptionKey: 'preventive-process-step2-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'preventive-process-step3-num',
        titleKey: 'preventive-process-step3-title',
        descriptionKey: 'preventive-process-step3-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'preventive-process-step4-num',
        titleKey: 'preventive-process-step4-title',
        descriptionKey: 'preventive-process-step4-desc',
        imageUrl: '/images/or.jpg'
      }
    ],

    candidatesTitleKey: 'preventive-candidates-title',
    candidatesIntroKey: 'preventive-candidates-intro',
    candidatesKeys: [
      'preventive-candidate1',
      'preventive-candidate2',
      'preventive-candidate3',
      'preventive-candidate4',
      'preventive-candidate5',
      'preventive-candidate6'
    ],

    faqTitleKey: 'preventive-faq-title',
    faqSubtitleKey: 'preventive-faq-subtitle',
    faqKeys: [
      { questionKey: 'preventive-faq1-q', answerKey: 'preventive-faq1-a' },
      { questionKey: 'preventive-faq2-q', answerKey: 'preventive-faq2-a' },
      { questionKey: 'preventive-faq3-q', answerKey: 'preventive-faq3-a' },
      { questionKey: 'preventive-faq4-q', answerKey: 'preventive-faq4-a' },
      { questionKey: 'preventive-faq5-q', answerKey: 'preventive-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'preventive-package-1-name',
        price: '$30 - $60',
        priceNoteKey: 'per-visit',
        featuresKeys: ['preventive-package-1-item1', 'preventive-package-1-item2', 'preventive-package-1-item3']
      },
      {
        nameKey: 'preventive-package-2-name',
        price: '$50 - $150',
        priceNoteKey: 'per-tooth',
        featuresKeys: ['preventive-package-2-item1', 'preventive-package-2-item2', 'preventive-package-2-item3'],
        featured: true
      },
      {
        nameKey: 'preventive-package-3-name',
        price: '$150 - $300',
        featuresKeys: ['preventive-package-3-item1', 'preventive-package-3-item2', 'preventive-package-3-item3']
      }
    ]
  },

  'oral-surgery': {
    slug: 'oral-surgery',
    titleKey: 'oral-surgery-service-title',
    subtitleKey: 'oral-surgery-service-subtitle',
    seoTitle: 'Oral Surgery | First Ave Dental',
    seoDescription: '口腔外科：拔牙、智齿拔除、牙槽外科、种植前准备。',
    seoKeywords: '口腔外科, 拔牙, 智齿, 牙槽外科, 种植准备',

    overviewTitleKey: 'oral-surgery-overview-title',
    overviewParagraphs: ['oral-surgery-overview-p1', 'oral-surgery-overview-p2', 'oral-surgery-overview-p3'],
    overviewHighlightKey: 'oral-surgery-overview-highlight',
    overviewImage: '/images/oral.jpg',
    overviewImageAltKey: 'oral-surgery-card-title',

    processTitleKey: 'oral-surgery-process-title',
    processSubtitleKey: 'oral-surgery-process-subtitle',
    processSteps: [
      {
        numberKey: 'oral-surgery-process-step1-num',
        titleKey: 'oral-surgery-process-step1-title',
        descriptionKey: 'oral-surgery-process-step1-desc',
        imageUrl: '/images/oral.jpg'
      },
      {
        numberKey: 'oral-surgery-process-step2-num',
        titleKey: 'oral-surgery-process-step2-title',
        descriptionKey: 'oral-surgery-process-step2-desc',
        imageUrl: '/images/family.jpg'
      },
      {
        numberKey: 'oral-surgery-process-step3-num',
        titleKey: 'oral-surgery-process-step3-title',
        descriptionKey: 'oral-surgery-process-step3-desc',
        imageUrl: '/images/cosmetic.jpg'
      },
      {
        numberKey: 'oral-surgery-process-step4-num',
        titleKey: 'oral-surgery-process-step4-title',
        descriptionKey: 'oral-surgery-process-step4-desc',
        imageUrl: '/images/or.jpg'
      }
    ],

    candidatesTitleKey: 'oral-surgery-candidates-title',
    candidatesIntroKey: 'oral-surgery-candidates-intro',
    candidatesKeys: [
      'oral-surgery-candidate1',
      'oral-surgery-candidate2',
      'oral-surgery-candidate3',
      'oral-surgery-candidate4',
      'oral-surgery-candidate5',
      'oral-surgery-candidate6'
    ],

    faqTitleKey: 'oral-surgery-faq-title',
    faqSubtitleKey: 'oral-surgery-faq-subtitle',
    faqKeys: [
      { questionKey: 'oral-surgery-faq1-q', answerKey: 'oral-surgery-faq1-a' },
      { questionKey: 'oral-surgery-faq2-q', answerKey: 'oral-surgery-faq2-a' },
      { questionKey: 'oral-surgery-faq3-q', answerKey: 'oral-surgery-faq3-a' },
      { questionKey: 'oral-surgery-faq4-q', answerKey: 'oral-surgery-faq4-a' },
      { questionKey: 'oral-surgery-faq5-q', answerKey: 'oral-surgery-faq5-a' }
    ],

    pricingTitleKey: 'pricing-title',
    pricingPackages: [
      {
        nameKey: 'oral-surgery-package-1-name',
        price: '$150 - $300',
        priceNoteKey: 'per-tooth',
        featuresKeys: ['oral-surgery-package-1-item1', 'oral-surgery-package-1-item2', 'oral-surgery-package-1-item3']
      },
      {
        nameKey: 'oral-surgery-package-2-name',
        price: '$300 - $600',
        priceNoteKey: 'per-tooth',
        featuresKeys: ['oral-surgery-package-2-item1', 'oral-surgery-package-2-item2', 'oral-surgery-package-2-item3'],
        featured: true
      },
      {
        nameKey: 'oral-surgery-package-3-name',
        price: '$800 - $1,500',
        featuresKeys: ['oral-surgery-package-3-item1', 'oral-surgery-package-3-item2', 'oral-surgery-package-3-item3']
      }
    ]
  }
};

// Helper function to get all service slugs
export const getAllServiceSlugs = (): string[] => {
  return Object.keys(servicesConfig);
};

// Helper function to get service config by slug
export const getServiceBySlug = (slug: string): ServiceConfig | undefined => {
  return servicesConfig[slug];
};
