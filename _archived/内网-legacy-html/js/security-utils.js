/**
 * Security Utilities for XSS Prevention
 *
 * This module provides safe alternatives to innerHTML and other XSS-prone operations.
 * Use these functions instead of directly setting innerHTML with user input.
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} The escaped string safe for HTML insertion
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

/**
 * Safely sets text content (replaces innerHTML for text-only content)
 * @param {HTMLElement} element - The target element
 * @param {string} text - The text to set
 */
export function safeSetText(element, text) {
  element.textContent = text || '';
}

/**
 * Creates an element with safe text content
 * @param {string} tagName - The HTML tag name
 * @param {string} text - The text content
 * @param {string} className - Optional CSS class
 * @returns {HTMLElement}
 */
export function createSafeElement(tagName, text = '', className = '') {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Safely creates HTML with escaped user input
 * Use template literals with this function to mix HTML structure with user data
 * @param {string} template - HTML template string
 * @param {Object} data - Data object with values to escape
 * @returns {string} Safe HTML string
 *
 * @example
 * const html = safeHtml`
 *   <div class="user-card">
 *     <h3>${{name: userData.name}}</h3>
 *     <p>${{email: userData.email}}</p>
 *   </div>
 * `;
 */
export function safeHtml(strings, ...values) {
  let result = '';

  strings.forEach((str, i) => {
    result += str;

    if (i < values.length) {
      const value = values[i];

      // If value is an object with a single key, escape that value
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const key = Object.keys(value)[0];
        result += escapeHtml(value[key]);
      } else {
        // For non-objects, convert to string and escape
        result += escapeHtml(value);
      }
    }
  });

  return result;
}

/**
 * Validates and sanitizes a URL to prevent javascript: and data: URLs
 * @param {string} url - The URL to validate
 * @param {string} defaultUrl - Default URL if validation fails
 * @returns {string} Safe URL
 */
export function sanitizeUrl(url, defaultUrl = '#') {
  if (!url) return defaultUrl;

  const urlStr = String(url).toLowerCase().trim();

  // Block dangerous protocols
  if (
    urlStr.startsWith('javascript:') ||
    urlStr.startsWith('data:') ||
    urlStr.startsWith('vbscript:')
  ) {
    console.warn('Blocked potentially dangerous URL:', url);
    return defaultUrl;
  }

  return url;
}

/**
 * Safely appends child elements to a parent
 * Clears existing content and adds new children safely
 * @param {HTMLElement} parent - Parent element
 * @param {HTMLElement|HTMLElement[]} children - Child element(s) to append
 */
export function safeAppendChildren(parent, children) {
  // Clear existing content
  parent.textContent = '';

  // Append new children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (child instanceof HTMLElement) {
      parent.appendChild(child);
    }
  });
}

/**
 * Creates a safe appointment card element
 * @param {Object} appointment - Appointment data
 * @returns {HTMLElement}
 */
export function createAppointmentCard(appointment) {
  const card = document.createElement('div');
  card.className = 'appointment-card';

  const title = document.createElement('h3');
  title.textContent = appointment.patientName || '未命名患者';

  const phone = document.createElement('p');
  phone.textContent = `电话: ${appointment.patientPhone || '无'}`;

  const clinic = document.createElement('p');
  clinic.textContent = `诊所: ${appointment.clinicLocation || '未知'}`;

  const date = document.createElement('p');
  date.textContent = `日期: ${appointment.appointmentDate || '未设置'}`;

  card.appendChild(title);
  card.appendChild(phone);
  card.appendChild(clinic);
  card.appendChild(date);

  return card;
}

/**
 * Creates a safe message element
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, warning, info)
 * @returns {HTMLElement}
 */
export function createMessageElement(message, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;

  const icon = document.createElement('i');
  icon.className = type === 'success' ? 'fas fa-check-circle' :
                   type === 'error' ? 'fas fa-exclamation-circle' :
                   type === 'warning' ? 'fas fa-exclamation-triangle' :
                   'fas fa-info-circle';

  const text = document.createElement('span');
  text.textContent = message;

  messageEl.appendChild(icon);
  messageEl.appendChild(text);

  return messageEl;
}

/**
 * Validates input against common XSS patterns
 * @param {string} input - Input to validate
 * @returns {boolean} True if input appears safe
 */
export function validateInput(input) {
  if (!input) return true;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitizes and limits string length
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLength = 1000) {
  if (!str) return '';

  let sanitized = String(str).trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}
