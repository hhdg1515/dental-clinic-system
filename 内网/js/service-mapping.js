// Service mapping between external (patient-facing) and internal (admin-facing) systems
// This file defines the relationship between external service categories and internal detailed services

// External services (what patients see and select)
const EXTERNAL_SERVICES = [
    'General',
    'Implant',
    'Extraction',
    'Preventive',
    'Cosmetic',
    'Orthodontics',
    'Root Canals',
    'Restorations',
    'Periodontics'
];

// Internal services (what admins can select - more detailed breakdown)
const INTERNAL_SERVICES = {
    'General': {
        label: 'General',
        subcategories: [
            'General Consultation',
            'General Examination',
            'General Treatment',
            'Pain Management',
            'Emergency Care'
        ]
    },
    'Implant': {
        label: 'Implant',
        subcategories: [
            'Implant Consultation',
            'Early Stage Implant',
            'Standard Implant',
            'Full Mouth Implant',
            'Implant Crown',
            'Implant Maintenance'
        ]
    },
    'Extraction': {
        label: 'Oral Surgery/Extraction',
        subcategories: [
            'Simple Extraction',
            'Surgical Extraction',
            'Wisdom Tooth Extraction',
            'Multiple Extractions',
            'Bone Grafting'
        ]
    },
    'Preventive': {
        label: 'Preventive Care',
        subcategories: [
            'Regular Cleaning',
            'Deep Cleaning',
            'Fluoride Treatment',
            'Dental Sealants',
            'Oral Hygiene Education'
        ]
    },
    'Cosmetic': {
        label: 'Cosmetic Dentistry',
        subcategories: [
            'Teeth Whitening',
            'Veneers',
            'Bonding',
            'Cosmetic Consultation',
            'Smile Makeover'
        ]
    },
    'Orthodontics': {
        label: 'Orthodontics',
        subcategories: [
            'Braces Consultation',
            'Metal Braces',
            'Clear Braces',
            'Invisalign',
            'Retainers',
            'Orthodontic Adjustment'
        ]
    },
    'Root Canals': {
        label: 'Endodontics',
        subcategories: [
            'Root Canal Therapy',
            'Root Canal Retreatment',
            'Apicoectomy',
            'Pulp Therapy',
            'Endodontic Consultation'
        ]
    },
    'Restorations': {
        label: 'Restorative Dentistry',
        subcategories: [
            'Composite Fillings',
            'Amalgam Fillings',
            'Crowns',
            'Bridges',
            'Inlays/Onlays'
        ]
    },
    'Periodontics': {
        label: 'Periodontal Care',
        subcategories: [
            'Gum Treatment',
            'Scaling and Root Planing',
            'Gum Surgery',
            'Periodontal Maintenance',
            'Gum Grafting'
        ]
    }
};

// Function to get all internal service options (flattened for dropdowns)
function getAllInternalServices() {
    const services = [];

    Object.keys(INTERNAL_SERVICES).forEach(category => {
        const categoryData = INTERNAL_SERVICES[category];

        // Add the main category
        services.push({
            value: category.toLowerCase().replace(/\s+/g, '-'),
            label: categoryData.label,
            category: category,
            isMainCategory: true
        });

        // Add subcategories
        categoryData.subcategories.forEach(subcategory => {
            services.push({
                value: subcategory.toLowerCase().replace(/\s+/g, '-'),
                label: subcategory,
                category: category,
                isMainCategory: false
            });
        });
    });

    return services;
}

// Function to map external service to internal services
function getInternalServicesForExternal(externalService) {
    if (INTERNAL_SERVICES[externalService]) {
        return INTERNAL_SERVICES[externalService].subcategories;
    }
    return [];
}

// Function to map internal service back to external category
function getExternalCategoryForInternal(internalService) {
    for (const [category, data] of Object.entries(INTERNAL_SERVICES)) {
        if (data.subcategories.includes(internalService) ||
            category.toLowerCase().replace(/\s+/g, '-') === internalService) {
            return category;
        }
    }
    return 'General'; // Fallback
}

// Function to get service display name (for backwards compatibility)
function getServiceDisplayName(serviceValue) {
    if (!serviceValue) return '';

    // Handle the existing service values
    const serviceMap = {
        'general': 'General',
        'implant': 'Implant',
        'extraction': 'Extraction',
        'preventive': 'Preventive',
        'cosmetic': 'Cosmetic',
        'orthodontics': 'Orthodontics',
        'root-canals': 'Root Canals',
        'restorations': 'Restorations',
        'periodontics': 'Periodontics'
    };

    // First check if it's a direct match
    if (serviceMap[serviceValue]) {
        return serviceMap[serviceValue];
    }

    // Check if it's an internal service
    const allServices = getAllInternalServices();
    const found = allServices.find(s => s.value === serviceValue);
    if (found) {
        return found.label;
    }

    // Return as-is if no mapping found (capitalize first letter)
    return serviceValue.charAt(0).toUpperCase() + serviceValue.slice(1);
}

// Function to populate service dropdown for internal admin use
function populateInternalServiceDropdown(selectElement) {
    if (!selectElement) return;

    const services = getAllInternalServices();
    selectElement.innerHTML = '<option value="">Select Service</option>';

    let currentCategory = '';
    services.forEach(service => {
        if (service.isMainCategory && service.category !== currentCategory) {
            currentCategory = service.category;

            // Add category header
            const optgroup = document.createElement('optgroup');
            optgroup.label = service.label;
            selectElement.appendChild(optgroup);

            // Add main category option
            const mainOption = document.createElement('option');
            mainOption.value = service.value;
            mainOption.textContent = service.label;
            mainOption.style.fontWeight = 'bold';
            optgroup.appendChild(mainOption);

            // Add subcategories
            const subcategories = getInternalServicesForExternal(service.category);
            subcategories.forEach(subcategory => {
                const option = document.createElement('option');
                option.value = subcategory.toLowerCase().replace(/\s+/g, '-');
                option.textContent = '  • ' + subcategory;
                optgroup.appendChild(option);
            });
        }
    });
}

// Export functions for use in other files
window.ServiceMapping = {
    EXTERNAL_SERVICES,
    INTERNAL_SERVICES,
    getAllInternalServices,
    getInternalServicesForExternal,
    getExternalCategoryForInternal,
    getServiceDisplayName,
    populateInternalServiceDropdown
};