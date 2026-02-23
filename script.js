// ====== INITIALIZE BOOTSTRAP TOOLTIPS ======
document.addEventListener('DOMContentLoaded', function () {
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(function (el) {
    new bootstrap.Tooltip(el);
  });
});

// ====== MECHANIC OFF-DAY MAP ======
// 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
const mechanicOffDays = {
  'Mark Dupont': 3,   // Wednesday
  'Sarah Drake': 1,   // Monday
  'James Martin': 5   // Friday
};

// ====== DATE INPUT RESTRICTIONS ======
const dateInput = document.getElementById('booking-date');
const dateHint = document.getElementById('date-hint');

// Set min date to today so past dates are blocked by the browser picker
const today = new Date();
const todayStr = today.getFullYear() + '-' +
  String(today.getMonth() + 1).padStart(2, '0') + '-' +
  String(today.getDate()).padStart(2, '0');
dateInput.setAttribute('min', todayStr);

// Listen for mechanic selection to update date hint
document.querySelectorAll('input[name="mechanic"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    const mechName = this.value;
    const offDay = mechanicOffDays[mechName];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dateHint.innerHTML = '<i class="bi bi-info-circle-fill me-2"></i>' +
      '<strong>' + mechName + '</strong> is off on <strong>' + dayNames[offDay] + 's</strong> and weekends. ' +
      'These dates are unavailable.';
    dateHint.classList.remove('alert-info');
    dateHint.classList.add('alert-warning');

    // Highlight the selected expert card
    document.querySelectorAll('.expert-select-card').forEach(function (card) {
      card.classList.remove('border-warning', 'bg-warning-subtle');
    });
    this.closest('.expert-select-card').classList.add('border-warning', 'bg-warning-subtle');

    // Clear date if it's now invalid
    validateDateForMechanic();

    // Show toast feedback
    showToast('info', '<i class="bi bi-person-check me-2"></i>Selected mechanic: ' + mechName);
  });
});

// Validate date against selected mechanic's off-day and weekends
dateInput.addEventListener('change', function () {
  validateDateForMechanic();
  filterPastTimeSlots();
});

function validateDateForMechanic() {
  if (!dateInput.value) return;

  const date = new Date(dateInput.value + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Block past dates
  if (date < now) {
    dateInput.setCustomValidity('Cannot book a date in the past.');
    dateInput.classList.add('is-invalid');
    dateInput.classList.remove('is-valid');
    document.getElementById('date-error').textContent = 'Cannot book a date in the past. Please select today or a future date.';
    showToast('danger', '<i class="bi bi-exclamation-triangle me-2"></i>That date is in the past. Please choose a future date.');
    return;
  }

  const selectedMechanic = document.querySelector('input[name="mechanic"]:checked');
  if (!selectedMechanic) return;

  const dayOfWeek = date.getDay();
  const offDay = parseInt(selectedMechanic.getAttribute('data-offday'));

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    dateInput.setCustomValidity('We are closed on weekends. Please select a weekday.');
    dateInput.classList.add('is-invalid');
    document.getElementById('date-error').textContent = 'We are closed on weekends. Please select a weekday.';
    showToast('danger', '<i class="bi bi-exclamation-triangle me-2"></i>Weekends are unavailable. Please pick a weekday.');
  } else if (dayOfWeek === offDay) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dateInput.setCustomValidity(selectedMechanic.value + ' is off on ' + dayNames[offDay] + 's.');
    dateInput.classList.add('is-invalid');
    document.getElementById('date-error').textContent = selectedMechanic.value + ' is off on ' + dayNames[offDay] + 's. Please choose another date.';
    showToast('danger', '<i class="bi bi-exclamation-triangle me-2"></i>' + selectedMechanic.value + ' is not available on ' + dayNames[offDay] + 's.');
  } else {
    dateInput.setCustomValidity('');
    dateInput.classList.remove('is-invalid');
    dateInput.classList.add('is-valid');
  }
}

// ====== TIME SLOT RESTRICTIONS (disable past times when today is selected) ======
const timeSelect = document.getElementById('booking-time');

function filterPastTimeSlots() {
  const now = new Date();
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const selectedDate = dateInput.value ? new Date(dateInput.value + 'T00:00:00') : null;
  const isToday = selectedDate && selectedDate.getTime() === todayDate.getTime();

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Reset all options first
  Array.from(timeSelect.options).forEach(function (opt) {
    if (opt.value === '') return; // skip placeholder
    opt.disabled = false;
    opt.textContent = opt.textContent.replace(' (passed)', '');
  });

  if (isToday) {
    let anyAvailable = false;
    Array.from(timeSelect.options).forEach(function (opt) {
      if (opt.value === '') return;
      const parts = opt.value.split(':');
      const slotHour = parseInt(parts[0]);
      const slotMinute = parseInt(parts[1]);

      if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
        opt.disabled = true;
        opt.textContent = opt.textContent.replace(' (passed)', '') + ' (passed)';
      } else {
        anyAvailable = true;
      }
    });

    // If the currently selected time is now past, clear it and show error
    if (timeSelect.value) {
      const selParts = timeSelect.value.split(':');
      const selHour = parseInt(selParts[0]);
      const selMinute = parseInt(selParts[1]);
      if (selHour < currentHour || (selHour === currentHour && selMinute <= currentMinute)) {
        timeSelect.value = '';
        timeSelect.setCustomValidity('That time has already passed today. Please pick a later slot.');
        timeSelect.classList.add('is-invalid');
        timeSelect.classList.remove('is-valid');
        document.getElementById('time-error').textContent = 'That time has already passed. Please select a later time slot.';
        showToast('danger', '<i class="bi bi-exclamation-triangle me-2"></i>That time slot has already passed today.');
        return;
      }
    }

    if (!anyAvailable) {
      timeSelect.setCustomValidity('No more time slots available today. Please pick another date.');
      timeSelect.classList.add('is-invalid');
      timeSelect.classList.remove('is-valid');
      document.getElementById('time-error').textContent = 'All time slots for today have passed. Please choose a future date.';
      showToast('danger', '<i class="bi bi-exclamation-triangle me-2"></i>All time slots for today have passed.');
      return;
    }
  }

  // If a valid time is selected, mark valid
  if (timeSelect.value) {
    timeSelect.setCustomValidity('');
    timeSelect.classList.remove('is-invalid');
    timeSelect.classList.add('is-valid');
  }
}

// Run when time is selected — validate it hasn't passed
timeSelect.addEventListener('change', function () {
  filterPastTimeSlots();
});

// ====== REAL-TIME INPUT VALIDATION ======

// Name fields: no numbers allowed
['fname', 'lname', 'card-name'].forEach(function (id) {
  const field = document.getElementById(id);
  field.addEventListener('input', function () {
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (this.value === '') {
      this.classList.remove('is-valid', 'is-invalid');
      this.setCustomValidity('');
    } else if (!nameRegex.test(this.value)) {
      this.classList.add('is-invalid');
      this.classList.remove('is-valid');
      this.setCustomValidity('Only letters, spaces, hyphens and apostrophes are allowed.');
    } else {
      this.classList.add('is-valid');
      this.classList.remove('is-invalid');
      this.setCustomValidity('');
    }
  });
});

// Phone: regex validation
document.getElementById('phone').addEventListener('input', function () {
  const phoneRegex = /^\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}$/;
  if (this.value === '') {
    this.classList.remove('is-valid', 'is-invalid');
    this.setCustomValidity('');
  } else if (!phoneRegex.test(this.value)) {
    this.classList.add('is-invalid');
    this.classList.remove('is-valid');
    this.setCustomValidity('Enter a valid phone number e.g. (613) 555-0123');
  } else {
    this.classList.add('is-valid');
    this.classList.remove('is-invalid');
    this.setCustomValidity('');
  }
});

// Email: live validation
document.getElementById('email').addEventListener('input', function () {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (this.value === '') {
    this.classList.remove('is-valid', 'is-invalid');
  } else if (!emailRegex.test(this.value)) {
    this.classList.add('is-invalid');
    this.classList.remove('is-valid');
  } else {
    this.classList.add('is-valid');
    this.classList.remove('is-invalid');
  }
});

// Card number: auto-format with spaces and regex validate
document.getElementById('card-number').addEventListener('input', function () {
  // Remove non-digits, then add spaces every 4
  let val = this.value.replace(/\D/g, '');
  if (val.length > 16) val = val.substring(0, 16);
  let formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
  this.value = formatted;

  const cardRegex = /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/;
  if (val === '') {
    this.classList.remove('is-valid', 'is-invalid');
    this.setCustomValidity('');
  } else if (!cardRegex.test(formatted)) {
    this.classList.add('is-invalid');
    this.classList.remove('is-valid');
    this.setCustomValidity('Enter a valid 16-digit card number');
  } else {
    this.classList.add('is-valid');
    this.classList.remove('is-invalid');
    this.setCustomValidity('');
  }
});

// Expiry: auto-format MM/YY
document.getElementById('card-expiry').addEventListener('input', function () {
  let val = this.value.replace(/\D/g, '');
  if (val.length > 4) val = val.substring(0, 4);
  if (val.length >= 3) {
    val = val.substring(0, 2) + '/' + val.substring(2);
  }
  this.value = val;

  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (val === '') {
    this.classList.remove('is-valid', 'is-invalid');
    this.setCustomValidity('');
  } else if (!expiryRegex.test(val)) {
    this.classList.add('is-invalid');
    this.classList.remove('is-valid');
    this.setCustomValidity('Enter expiry as MM/YY');
  } else {
    // Check if the expiry date is in the past
    const parts = val.split('/');
    const expMonth = parseInt(parts[0]);
    const expYear = parseInt(parts[1]) + 2000;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      this.classList.add('is-invalid');
      this.classList.remove('is-valid');
      this.setCustomValidity('Card has expired. Please enter a future expiry date.');
      document.querySelector('#card-expiry ~ .invalid-feedback').textContent = 'Card has expired. Please enter a future expiry date.';
    } else {
      this.classList.add('is-valid');
      this.classList.remove('is-invalid');
      this.setCustomValidity('');
      document.querySelector('#card-expiry ~ .invalid-feedback').textContent = 'Enter a valid expiry (MM/YY).';
    }
  }
});

// CVV: only digits, 3-4 length
document.getElementById('card-cvv').addEventListener('input', function () {
  let val = this.value.replace(/\D/g, '');
  if (val.length > 4) val = val.substring(0, 4);
  this.value = val;

  const cvvRegex = /^\d{3,4}$/;
  if (val === '') {
    this.classList.remove('is-valid', 'is-invalid');
    this.setCustomValidity('');
  } else if (!cvvRegex.test(val)) {
    this.classList.add('is-invalid');
    this.classList.remove('is-valid');
    this.setCustomValidity('Enter 3 or 4 digit CVV');
  } else {
    this.classList.add('is-valid');
    this.classList.remove('is-invalid');
    this.setCustomValidity('');
  }
});

// ====== FORM SUBMISSION ======
document.getElementById('bookingForm').addEventListener('submit', function (e) {
  e.preventDefault();
  let isValid = true;
  const errorSummary = document.getElementById('form-error-summary');

  // Validate service selection
  const serviceSelected = document.querySelector('input[name="service"]:checked');
  const serviceError = document.getElementById('service-error');
  if (!serviceSelected) {
    serviceError.textContent = 'Please select a service.';
    serviceError.style.cssText = 'display:block !important;';
    isValid = false;
  } else {
    serviceError.style.cssText = 'display:none !important;';
  }

  // Validate mechanic selection
  const mechanicSelected = document.querySelector('input[name="mechanic"]:checked');
  const mechanicError = document.getElementById('mechanic-error');
  if (!mechanicSelected) {
    mechanicError.textContent = 'Please select a mechanic.';
    mechanicError.style.cssText = 'display:block !important;';
    isValid = false;
  } else {
    mechanicError.style.cssText = 'display:none !important;';
  }

  // Validate date against mechanic
  validateDateForMechanic();

  // Check all native validation
  if (!this.checkValidity()) {
    isValid = false;
  }

  // Show/hide validation states
  this.classList.add('was-validated');

  if (!isValid) {
    errorSummary.classList.remove('d-none');
    showToast('danger', '<i class="bi bi-exclamation-triangle me-2"></i>Please correct the errors in the form.');
    // Scroll to first error
    const firstInvalid = this.querySelector(':invalid, .is-invalid');
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus();
    }
    return;
  }

  errorSummary.classList.add('d-none');

  // Build confirmation summary
  const summary = document.getElementById('booking-summary');
  summary.innerHTML = '<div class="card-body text-start">' +
    '<h6 class="fw-bold mb-2"><i class="bi bi-receipt text-warning me-2"></i>Booking Summary</h6>' +
    '<p class="mb-1"><i class="bi bi-wrench text-warning me-2"></i><strong>Service:</strong> ' + serviceSelected.value + '</p>' +
    '<p class="mb-1"><i class="bi bi-person-badge text-warning me-2"></i><strong>Mechanic:</strong> ' + mechanicSelected.value + '</p>' +
    '<p class="mb-1"><i class="bi bi-calendar3 text-warning me-2"></i><strong>Date:</strong> ' + dateInput.value + '</p>' +
    '<p class="mb-1"><i class="bi bi-clock text-warning me-2"></i><strong>Time:</strong> ' + document.getElementById('booking-time').options[document.getElementById('booking-time').selectedIndex].text + '</p>' +
    '<p class="mb-1"><i class="bi bi-person text-warning me-2"></i><strong>Name:</strong> ' + document.getElementById('fname').value + ' ' + document.getElementById('lname').value + '</p>' +
    '<p class="mb-1"><i class="bi bi-envelope text-warning me-2"></i><strong>Email:</strong> ' + document.getElementById('email').value + '</p>' +
    '<p class="mb-0"><i class="bi bi-credit-card text-warning me-2"></i><strong>Card:</strong> **** **** **** ' + document.getElementById('card-number').value.replace(/\s/g, '').slice(-4) + '</p>' +
    '</div>';

  // Show confirmation
  document.getElementById('confirmation').style.display = 'block';
  document.getElementById('confirmation').scrollIntoView({ behavior: 'smooth' });

  showToast('success', '<i class="bi bi-check-circle me-2"></i>Booking confirmed! Thank you for choosing ChainLink.');
});

// ====== TOAST HELPER ======
function showToast(type, message) {
  const toastEl = document.getElementById('feedbackToast');
  toastEl.className = 'toast align-items-center text-bg-' + type + ' border-0';
  document.getElementById('toast-message').innerHTML = message;
  var toast = new bootstrap.Toast(toastEl, { delay: 3500 });
  toast.show();
}

// ====== RESET FORM ======
function resetForm() {
  document.getElementById('bookingForm').reset();
  document.getElementById('bookingForm').classList.remove('was-validated');
  document.getElementById('confirmation').style.display = 'none';
  document.getElementById('form-error-summary').classList.add('d-none');

  // Clear validation classes
  document.querySelectorAll('.is-valid, .is-invalid').forEach(function (el) {
    el.classList.remove('is-valid', 'is-invalid');
  });
  // Clear expert card highlights
  document.querySelectorAll('.expert-select-card').forEach(function (card) {
    card.classList.remove('border-warning', 'bg-warning-subtle');
  });
  // Reset date hint
  dateHint.innerHTML = '<i class="bi bi-info-circle-fill me-2"></i>Please select a mechanic first to see available dates. Weekends and off-days are unavailable.';
  dateHint.classList.remove('alert-warning');
  dateHint.classList.add('alert-info');

  // Hide error displays
  document.getElementById('service-error').style.cssText = 'display:none !important;';
  document.getElementById('mechanic-error').style.cssText = 'display:none !important;';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== SERVICE SELECTION FEEDBACK ======
document.querySelectorAll('input[name="service"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    document.getElementById('service-error').style.cssText = 'display:none !important;';
    showToast('info', '<i class="bi bi-wrench me-2"></i>Selected service: ' + this.value);
  });
});
