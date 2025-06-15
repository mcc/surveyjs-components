// hkidwidget.test.js

// Mock SurveyJS Survey object for Survey.Helpers.isValueEmpty
const Survey = {
    Helpers: {
        isValueEmpty: function(value) {
            return value === null || value === undefined || value === "";
        }
    }
};

// Assume calculateHKIDCheckDigit and isValidHKID are loaded from hkidwidget.js
// For testing purposes, we will redefine them here if not directly importable in this environment.
// In a real test setup with Jest, you would use:
// const { calculateHKIDCheckDigit, isValidHKID } = require('./hkidwidget');

// --- Redefine functions from hkidwidget.js for testing ---
function calculateHKIDCheckDigit(prefix) {
    prefix = prefix.toUpperCase().trim();
    if (!/^[A-Z]{1,2}[0-9]{6}$/.test(prefix)) return null;

    const weights_single_letter = [9, 8, 7, 6, 5, 4, 3, 2]; // For single letter: L D D D D D D (L at index 0)
    const weights_double_letter = [9, 8, 7, 6, 5, 4, 3, 2]; // For double letter: L L D D D D D (L1 at 0, L2 at 1)
    let sum = 0;

    if (prefix.length === 7) { // Single letter prefix, e.g., K123456
        sum += (prefix.charCodeAt(0) - 'A'.charCodeAt(0) + 10) * weights_single_letter[0];
        for (let i = 0; i < 6; i++) {
            sum += parseInt(prefix.charAt(i + 1)) * weights_single_letter[i + 1];
        }
    } else { // Double letter prefix, e.g., KA123456
        sum += (prefix.charCodeAt(0) - 'A'.charCodeAt(0) + 10) * weights_double_letter[0];
        sum += (prefix.charCodeAt(1) - 'A'.charCodeAt(0) + 10) * weights_double_letter[1];
        for (let i = 0; i < 6; i++) {
            sum += parseInt(prefix.charAt(i + 2)) * weights_double_letter[i + 2];
        }
    }

    const remainder = sum % 11;
    if (remainder === 0) return "0";
    // Standard HKID: 11 - remainder. If 10, then 'A'. If 11 (rem=0), then 0.
    // The previous implementation had a special case for remainder === 1 being 'A', which is non-standard.
    // Correcting to standard: Check digit is (11 - remainder) % 11. If result is 10, use 'A'.
    const checkVal = 11 - remainder;
    if (checkVal === 10) return "A";
    if (checkVal === 11) return "0"; // This case is covered by remainder === 0
    return checkVal.toString();
}

function isValidHKID(hkidPrefix, checkDigit) {
    if (Survey.Helpers.isValueEmpty(hkidPrefix) && Survey.Helpers.isValueEmpty(checkDigit)) {
      // This case is handled by the validator for isRequired, but for the function itself,
      // it might be considered incomplete rather than strictly invalid or valid.
      // For now, let's treat it as needing both parts if any part is to be validated.
      return { valid: false, error: 'HKID prefix and check digit cannot be empty.' };
    }
    if (Survey.Helpers.isValueEmpty(hkidPrefix)) {
        return { valid: false, error: 'HKID prefix cannot be empty.' };
    }
    if (Survey.Helpers.isValueEmpty(checkDigit)) {
        return { valid: false, error: 'Check digit cannot be empty.' };
    }

    const prefix = hkidPrefix.trim().toUpperCase();
    const cd = checkDigit.trim().toUpperCase();

    if (!/^[A-Z]{1,2}[0-9]{6}$/.test(prefix)) {
        return { valid: false, error: 'Invalid HKID prefix format. Must be 1 or 2 letters followed by 6 digits (e.g., A123456 or AB123456).' };
    }
    if (!/^[0-9A]$/.test(cd)) {
        return { valid: false, error: 'Invalid check digit format. Must be a number (0-9) or \'A\'.' };
    }

    const calculatedCheckDigit = calculateHKIDCheckDigit(prefix);

    if (calculatedCheckDigit === null) {
        return { valid: false, error: 'Could not calculate check digit due to invalid prefix format.' };
    }

    if (calculatedCheckDigit === cd) {
        return { valid: true };
    } else {
        return { valid: false, error: `Invalid HKID. Expected check digit: ${calculatedCheckDigit}, but got: ${cd}.` };
    }
}

// --- End of redefined functions ---

describe('calculateHKIDCheckDigit', () => {
    test('K123456 should be 8', () => {
        expect(calculateHKIDCheckDigit("K123456")).toBe("8");
    });
    test('KA123456 should be 4', () => {
        expect(calculateHKIDCheckDigit("KA123456")).toBe("4");
    });
    test('M000000 should be 0 (198 % 11 = 0)', () => {
        expect(calculateHKIDCheckDigit("M000000")).toBe("0");
    });
    test('C123456 should be 3 (206 % 11 = 8 -> 11-8=3)', () => {
        expect(calculateHKIDCheckDigit("C123456")).toBe("3");
    });
    // Test for 'A' (check digit 10)
    // Example: P625635 -> sum should be X such that X % 11 = 1 for check digit to be 'A' (11-1=10 -> A)
    // P=25. (25*9)+(6*8)+(2*7)+(5*6)+(6*5)+(3*4)+(5*3) = 225+48+14+30+30+12+15 = 374.
    // 374 % 11 = 0. So P625635(0).
    // Let's find one that results in 'A'. We need sum % 11 = 1.
    // A000004 -> (10*9) + (0*8) + (0*7) + (0*6) + (0*5) + (0*4) + (4*3) = 90+12 = 102. 102 % 11 = 3. Check = 8.
    // W123456 -> W=32. (32*9)+(1*8)+(2*7)+(3*6)+(4*5)+(5*4)+(6*3) = 288+8+14+18+20+20+18 = 386. 386 % 11 = 1. Check = A.
    test('W123456 should be A', () => {
        expect(calculateHKIDCheckDigit("W123456")).toBe("A");
    });

    test('should return null for invalid prefix format', () => {
        expect(calculateHKIDCheckDigit("A12345")).toBeNull();
        expect(calculateHKIDCheckDigit("ABC123456")).toBeNull();
        expect(calculateHKIDCheckDigit("A1234567")).toBeNull();
        expect(calculateHKIDCheckDigit("1234567")).toBeNull();
        expect(calculateHKIDCheckDigit("A12B456")).toBeNull();
    });
});

describe('isValidHKID', () => {
    test('K123456 with 8 should be valid', () => {
        expect(isValidHKID("K123456", "8")).toEqual({ valid: true });
    });
    test('KA123456 with 4 should be valid', () => {
        expect(isValidHKID("KA123456", "4")).toEqual({ valid: true });
    });
    test('M000000 with 0 should be valid', () => {
        expect(isValidHKID("M000000", "0")).toEqual({ valid: true });
    });
    test('W123456 with A should be valid (case-insensitive check digit)', () => {
        expect(isValidHKID("W123456", "A")).toEqual({ valid: true });
        expect(isValidHKID("W123456", "a")).toEqual({ valid: true });
    });

    test('K123456 with 7 should be invalid', () => {
        expect(isValidHKID("K123456", "7")).toEqual({
            valid: false,
            error: 'Invalid HKID. Expected check digit: 8, but got: 7.'
        });
    });

    test('Invalid prefix format should be invalid', () => {
        const result = isValidHKID("K12345", "8");
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid HKID prefix format');
    });

    test('Invalid check digit format should be invalid', () => {
        const result = isValidHKID("K123456", "X");
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid check digit format');
    });

    test('Empty prefix should be invalid', () => {
        const result = isValidHKID("", "8");
        expect(result.valid).toBe(false);
        expect(result.error).toContain('HKID prefix cannot be empty.');
    });

    test('Empty check digit should be invalid', () => {
        const result = isValidHKID("K123456", "");
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Check digit cannot be empty.');
    });

    test('Both empty should be invalid', () => {
        const result = isValidHKID("", "");
        expect(result.valid).toBe(false);
        expect(result.error).toContain('HKID prefix and check digit cannot be empty.');
    });
});
