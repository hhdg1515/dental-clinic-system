# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a dental clinic management system built with vanilla HTML, CSS, and JavaScript. The system includes:

- **Dashboard** (`dashboard.html`) - Main overview page
- **Patients** (`patients.html`) - Patient management interface
- **Appointments** (`appointments.html`) - Appointment scheduling and calendar view

## Architecture

### Data Management
- **LocalStorage-based**: Uses browser localStorage for data persistence
- **GlobalDataManager** (`js/data-manager.js`): Centralized data management class that handles all patient profiles, appointments, and system data
- **Versioned data structure**: Includes metadata versioning for data migration (currently v1.2.0)

### Code Organization
```
├── css/               # Page-specific stylesheets
│   ├── shared.css     # Common styles across all pages
│   ├── dashboard.css  # Dashboard-specific styles
│   ├── patients.css   # Patient page styles
│   └── appointments.css # Calendar page styles
├── js/
│   ├── shared.js      # Common functionality and navigation
│   ├── data-manager.js # Global data management
│   ├── dashboard.js   # Dashboard page logic
│   ├── patients.js    # Patient management logic
│   └── appointments.js # Calendar and scheduling logic
└── *.html            # Individual page templates
```

### Key Components
- **Navigation**: Shared sidebar navigation handled in `shared.js`
- **Global Search**: Cross-page search functionality with custom events
- **Notification System**: Bell icon with notification handling
- **Keyboard Shortcuts**: Global keyboard shortcuts for navigation

## Development Guidelines

### Core Principles (from README.md)
1. **Simplicity First**: Make every change as simple as possible, impacting minimal code
2. **Root Cause Focus**: When debugging, trace through the ENTIRE code flow step by step
3. **No Shortcuts**: Never make temporary fixes - find and fix root causes
4. **Plan-Driven Development**: Always create a plan with todo items before starting work
5. **Step-by-step Verification**: Check off todo items as you complete them

### File Testing
This is a static HTML/CSS/JavaScript project - no build tools or test runners are configured. Test by opening HTML files directly in a browser.

### Data Structure
The system uses a centralized data structure managed by `GlobalDataManager`:
- Patient profiles with detailed medical information
- Appointment scheduling with hourly time slots
- System metadata with versioning for migrations
- All data persists to localStorage under key 'dental_clinic_data'

### Navigation Flow
- `dashboard.html` ↔ `patients.html` ↔ `appointments.html`
- Shared navigation handled in `shared.js`
- Active page state maintained through HTML classes