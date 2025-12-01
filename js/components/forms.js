/**
 * Form Handler Component
 * Handles form validation, submission, and user feedback
 */

export class FormHandler {
  constructor() {
    this.forms = new Map();
    this.validationRules = new Map();
    
    this.init();
  }

  init() {
    // Find all forms and initialize them
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => this.initializeForm(form));
    
    // Initialize validation rules
    this.setupValidationRules();
  }

  initializeForm(form) {
    const formId = form.id || `form-${Date.now()}`;
    form.setAttribute('data-form-id', formId);
    
    const formData = {
      element: form,
      id: formId,
      fields: new Map(),
      isValid: false,
      isSubmitting: false
    };

    // Get all form fields
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => this.initializeField(field, formData));
    
    // Bind form events
    this.bindFormEvents(form, formData);
    
    this.forms.set(formId, formData);
  }

  initializeField(field, formData) {
    const fieldId = field.id || field.name;
    
    const fieldData = {
      element: field,
      id: fieldId,
      type: field.type,
      required: field.hasAttribute('required'),
      pattern: field.getAttribute('pattern'),
      minLength: field.getAttribute('minlength'),
      maxLength: field.getAttribute('maxlength'),
      isValid: false,
      errorMessage: '',
      showError: false
    };

    // Create error message container
    const errorContainer = this.createErrorContainer(fieldId);
    field.parentNode.insertBefore(errorContainer, field.nextSibling);

    fieldData.errorContainer = errorContainer;
    formData.fields.set(fieldId, fieldData);

    // Bind field events
    this.bindFieldEvents(field, fieldData);
  }

  createErrorContainer(fieldId) {
    const container = document.createElement('div');
    container.className = 'field-error';
    container.id = `error-${fieldId}`;
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'polite');
    return container;
  }

  bindFieldEvents(field, fieldData) {
    // Real-time validation on input
    field.addEventListener('input', () => {
      this.validateField(fieldData);
      this.updateFieldUI(fieldData);
    });

    // Validation on blur
    field.addEventListener('blur', () => {
      this.validateField(fieldData);
      this.updateFieldUI(fieldData);
      
      // Show error on blur if field is invalid and has been touched
      if (!fieldData.isValid && field.value) {
        fieldData.showError = true;
      }
    });

    // Hide error on focus
    field.addEventListener('focus', () => {
      fieldData.showError = false;
      this.updateFieldUI(fieldData);
    });

    // Validate select fields on change
    if (field.type === 'select-one') {
      field.addEventListener('change', () => {
        this.validateField(fieldData);
        this.updateFieldUI(fieldData);
      });
    }
  }

  bindFormEvents(form, formData) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(formData);
    });

    // Add loading state management
    form.addEventListener('submit-start', () => {
      formData.isSubmitting = true;
      this.updateFormUI(formData);
    });

    form.addEventListener('submit-end', () => {
      formData.isSubmitting = false;
      this.updateFormUI(formData);
    });
  }

  setupValidationRules() {
    // Email validation
    this.validationRules.set('email', {
      validate: (value) => {
        if (!value) return true; // Optional field
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      message: 'Please enter a valid email address'
    });

    // Password validation
    this.validationRules.set('password', {
      validate: (value) => {
        if (!value) return true; // Handled by required attribute
        return value.length >= 8;
      },
      message: 'Password must be at least 8 characters long'
    });

    // Phone validation
    this.validationRules.set('tel', {
      validate: (value) => {
        if (!value) return true; // Optional field
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
      },
      message: 'Please enter a valid phone number'
    });

    // Required field validation
    this.validationRules.set('required', {
      validate: (value) => {
        return value && value.trim().length > 0;
      },
      message: 'This field is required'
    });
  }

  validateField(fieldData) {
    const { element, value, type, required, pattern, minLength, maxLength } = fieldData;
    const fieldValue = element.value.trim();

    // Reset validation state
    fieldData.isValid = true;
    fieldData.errorMessage = '';

    // Check if required
    if (required && !fieldValue) {
      fieldData.isValid = false;
      fieldData.errorMessage = 'This field is required';
      return;
    }

    // Skip validation if field is empty and not required
    if (!fieldValue && !required) {
      return;
    }

    // Type-specific validation
    const rule = this.validationRules.get(type);
    if (rule && !rule.validate(fieldValue)) {
      fieldData.isValid = false;
      fieldData.errorMessage = rule.message;
      return;
    }

    // Pattern validation
    if (pattern) {
      const regex = new RegExp(pattern);
      if (!regex.test(fieldValue)) {
        fieldData.isValid = false;
        fieldData.errorMessage = element.getAttribute('data-error-message') || 'Invalid format';
        return;
      }
    }

    // Length validation
    if (minLength && fieldValue.length < parseInt(minLength)) {
      fieldData.isValid = false;
      fieldData.errorMessage = `Must be at least ${minLength} characters`;
      return;
    }

    if (maxLength && fieldValue.length > parseInt(maxLength)) {
      fieldData.isValid = false;
      fieldData.errorMessage = `Must be no more than ${maxLength} characters`;
      return;
    }
  }

  validateForm(formData) {
    let isValid = true;
    
    formData.fields.forEach(fieldData => {
      this.validateField(fieldData);
      if (!fieldData.isValid) {
        isValid = false;
        fieldData.showError = true;
      }
    });

    formData.isValid = isValid;
    return isValid;
  }

  updateFieldUI(fieldData) {
    const { element, errorContainer, isValid, errorMessage, showError } = fieldData;
    
    // Update field appearance
    if (isValid) {
      element.classList.remove('field-invalid');
      element.classList.add('field-valid');
    } else {
      element.classList.remove('field-valid');
      element.classList.add('field-invalid');
    }

    // Update error message
    if (showError && !isValid) {
      errorContainer.textContent = errorMessage;
      errorContainer.style.display = 'block';
      element.setAttribute('aria-invalid', 'true');
      element.setAttribute('aria-describedby', errorContainer.id);
    } else {
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
      element.setAttribute('aria-invalid', 'false');
      element.removeAttribute('aria-describedby');
    }
  }

  updateFormUI(formData) {
    const { element, isValid, isSubmitting } = formData;
    const submitButton = element.querySelector('button[type="submit"], input[type="submit"]');
    
    if (submitButton) {
      if (isSubmitting) {
        submitButton.disabled = true;
        submitButton.classList.add('loading');
        submitButton.textContent = 'Submitting...';
      } else {
        submitButton.disabled = false;
        submitButton.classList.remove('loading');
        submitButton.textContent = submitButton.getAttribute('data-original-text') || 'Submit';
      }
    }

    // Show form-level error if needed
    const formError = element.querySelector('.form-error');
    if (formError) {
      formError.style.display = isValid ? 'none' : 'block';
    }
  }

  async handleFormSubmit(formData) {
    if (!this.validateForm(formData)) {
      // Show errors for all invalid fields
      formData.fields.forEach(fieldData => {
        if (!fieldData.isValid) {
          fieldData.showError = true;
          this.updateFieldUI(fieldData);
        }
      });
      
      // Focus first invalid field
      const firstInvalid = formData.element.querySelector('.field-invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      
      return;
    }

    // Dispatch submit start event
    formData.element.dispatchEvent(new CustomEvent('submit-start'));
    
    try {
      // Get form action and method
      const action = formData.element.getAttribute('action') || '#';
      const method = formData.element.getAttribute('method') || 'POST';
      
      // Simulate form submission (replace with actual implementation)
      await this.submitForm(action, method, formData);
      
      // Show success message
      this.showSuccessMessage(formData);
      
      // Reset form if needed
      if (formData.element.hasAttribute('data-reset-on-success')) {
        formData.element.reset();
        formData.fields.forEach(fieldData => {
          fieldData.isValid = false;
          fieldData.showError = false;
          this.updateFieldUI(fieldData);
        });
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
      this.showErrorMessage(formData, error.message);
    } finally {
      // Dispatch submit end event
      formData.element.dispatchEvent(new CustomEvent('submit-end'));
    }
  }

  async submitForm(action, method, formData) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 1500);
    });
  }

  showSuccessMessage(formData) {
    const message = formData.element.getAttribute('data-success-message') || 'Form submitted successfully!';
    this.showNotification(message, 'success');
  }

  showErrorMessage(formData, error) {
    const message = formData.element.getAttribute('data-error-message') || `Error: ${error}`;
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Public method to add custom validation rules
  addValidationRule(name, rule) {
    this.validationRules.set(name, rule);
  }

  // Cleanup method
  destroy() {
    this.forms.forEach(formData => {
      // Remove event listeners and clean up
      formData.element.removeEventListener('submit', this.handleFormSubmit);
    });
    this.forms.clear();
  }
}