// --- HKID Validation Logic ---
const calculateHkidCheckDigit = (candidate) => {
  const prefix = candidate.toUpperCase();
  const pLen = prefix.length;
  const weights = [9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  const getCharValue = (char) => {
      return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
  }

  if (pLen === 7) { // Single letter prefix
      sum += getCharValue(prefix.charAt(0)) * weights[0];
      for (let i = 0; i < 6; i++) {
          sum += parseInt(prefix.charAt(i + 1)) * weights[i + 1];
      }
  } else { // Double letter prefix
      sum += getCharValue(prefix.charAt(0)) * weights[0];
      sum += getCharValue(prefix.charAt(1)) * weights[1];
      for (let i = 0; i < 6; i++) {
          sum += parseInt(prefix.charAt(i + 2)) * weights[i + 2];
      }
  }

  const remainder = sum % 11;
  if (remainder === 0) return '0';
  const checkDigit = 11 - remainder;
  if (checkDigit === 10) return 'A';
  return checkDigit.toString();
};


const validateHkid = (hkid) => {
  if (!hkid) return false;
  const cleanedHkid = hkid.replace(/[()\s]/g, '').toUpperCase();
  const hkidRegex = /^([A-Z]{1,2})([0-9]{6})([0-9A])$/;
  const match = cleanedHkid.match(hkidRegex);
  if (!match) return false;
  const mainPart = match[1] + match[2];
  const providedCheckDigit = match[3];
  const calculatedCheckDigit = calculateHkidCheckDigit(mainPart);
  return providedCheckDigit === calculatedCheckDigit;
};


// --- Global scope variables for SurveyJS classes ---
let HkidValidator;
let QuestionHkidModel;

const formatHkid = (text) => {
    if (!text) return "";
    let cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length > 9) cleaned = cleaned.substring(0, 9);
    let prefix = cleaned.match(/^[A-Z]{1,2}/);
    if(!prefix) return cleaned;
    prefix = prefix[0];
    let numbers = cleaned.substring(prefix.length);
    if(numbers.length > 6) {
        const checkdigit = numbers.substring(6);
        numbers = numbers.substring(0, 6);
        return `${prefix}${numbers}(${checkdigit})`;
    }
    return `${prefix}${numbers}`;
};

function initHkidComponent(Survey) {
  // --- SurveyJS Custom Validator ---
  if (Survey.SurveyValidator && !HkidValidator) {
    HkidValidator = class extends Survey.SurveyValidator {
      getType() { return "hkidvalidator"; }
      validate(value, name) {
        if (!value) {
          return this.question.isRequired ? new Survey.ValidatorResult(null, false, this.getErrorText("Value is required.")) : new Survey.ValidatorResult(null, true);
        }
        if (!validateHkid(value)) {
          return new Survey.ValidatorResult(value, false, this.getErrorText("Invalid HKID format or checksum."));
        }
        return new Survey.ValidatorResult(value, true);
      }
      getDefaultErrorText(name) { return "The HKID is not valid."; }
    }
    Survey.Serializer.addClass("hkidvalidator", [], function() { return new HkidValidator(); }, "surveyvalidator");
  }

  // --- SurveyJS Custom Question Model ---
  if (Survey.QuestionTextModel && !QuestionHkidModel) {
    QuestionHkidModel = class extends Survey.QuestionTextModel {
      constructor(name) {
        super(name);
        if (HkidValidator) {
          this.validators.push(new HkidValidator());
        }
      }
      getType() { return "hkid"; }
    }
    // --- Register the new question type ---
    Survey.Serializer.addClass("hkid", [], () => new QuestionHkidModel(""), "text");
  }

  // --- Custom Widget for formatting ---
  Survey.CustomWidgetCollection.Instance.add({
      name: "hkid",
      isFit: (question) => { return question.getType() === "hkid"; },
      afterRender: (question, el) => {
          const input = el.querySelector("input");
          if (input) {
              const handleInput = (event) => {
                  const start = event.target.selectionStart;
                  const oldValue = event.target.value;
                  const formattedValue = formatHkid(oldValue);
                  question.value = formattedValue;
                  if (oldValue !== formattedValue) {
                      let newCursorPos = start + (formattedValue.length - oldValue.length);
                      event.target.value = formattedValue;
                      event.target.setSelectionRange(newCursorPos, newCursorPos);
                  }
              };
              input.addEventListener('input', handleInput);
          }
      }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = initHkidComponent;
  module.exports.validateHkid = validateHkid;
  module.exports.QuestionHkidModel = () => QuestionHkidModel;
} else if (typeof Survey !== 'undefined') {
  initHkidComponent(Survey);
}
