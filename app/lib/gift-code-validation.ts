export interface GiftCodeInput {
  code: string;
  type: number;
  gold: number;
  gem: number;
  ruby: number;
  items?: string | null;
  status: number;
  expires_at?: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateGiftCode(data: GiftCodeInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Code validation: required, 6-20 characters, alphanumeric
  if (!data.code || data.code.trim() === '') {
    errors.push({ field: 'code', message: 'Code is required' });
  } else if (data.code.length < 6 || data.code.length > 20) {
    errors.push({ field: 'code', message: 'Code must be between 6 and 20 characters' });
  } else if (!/^[A-Za-z0-9]+$/.test(data.code)) {
    errors.push({ field: 'code', message: 'Code must be alphanumeric only' });
  }

  // Type validation: must be 0 or 1
  if (data.type !== 0 && data.type !== 1) {
    errors.push({ field: 'type', message: 'Type must be 0 (single-use) or 1 (multi-use)' });
  }

  // Rewards validation: at least one reward must be > 0
  const hasReward = data.gold > 0 || data.gem > 0 || data.ruby > 0 || (data.items && data.items !== '[]' && data.items.trim() !== '');
  if (!hasReward) {
    errors.push({ field: 'rewards', message: 'At least one reward (gold, gem, ruby, or items) must be greater than 0' });
  }

  // Numeric validations
  if (data.gold < 0) {
    errors.push({ field: 'gold', message: 'Gold must be non-negative' });
  }
  if (data.gem < 0) {
    errors.push({ field: 'gem', message: 'Gem must be non-negative' });
  }
  if (data.ruby < 0) {
    errors.push({ field: 'ruby', message: 'Ruby must be non-negative' });
  }

  // Status validation
  if (data.status !== 0 && data.status !== 1) {
    errors.push({ field: 'status', message: 'Status must be 0 (inactive) or 1 (active)' });
  }

  // Expiry date validation: if provided, must be in the future
  if (data.expires_at) {
    const expiryDate = new Date(data.expires_at);
    if (isNaN(expiryDate.getTime())) {
      errors.push({ field: 'expires_at', message: 'Invalid expiry date format' });
    } else if (expiryDate <= new Date()) {
      errors.push({ field: 'expires_at', message: 'Expiry date must be in the future' });
    }
  }

  return errors;
}

export function isValidGiftCode(data: GiftCodeInput): boolean {
  return validateGiftCode(data).length === 0;
}
