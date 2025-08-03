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
  if (!hkid) return true; // Empty is not invalid, it's just empty. Required is handled separately.
  const cleanedHkid = hkid.replace(/[()\s]/g, '').toUpperCase();
  const hkidRegex = /^([A-Z]{1,2})([0-9]{6})([0-9A])$/;
  const match = cleanedHkid.match(hkidRegex);
  if (!match) return false;
  const mainPart = match[1] + match[2];
  const providedCheckDigit = match[3];
  const calculatedCheckDigit = calculateHkidCheckDigit(mainPart);
  return providedCheckDigit === calculatedCheckDigit;
};


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
  // --- SurveyJS Custom Question Model ---
  const QuestionHkidModel = class extends Survey.Question {
      getType() { return "hkid"; }
  }
  Survey.Serializer.addClass("hkid", [], () => new QuestionHkidModel(""), "question");

  // --- Custom Widget for creating and validating the input ---
  Survey.CustomWidgetCollection.Instance.add({
      name: "hkid",
      isFit: (question) => { return question.getType() === "hkid"; },

      afterRender: (question, el) => {
          // Create the input element
          const input = document.createElement("input");
          input.type = "text";
          input.className = "sv-text";
          input.placeholder = question.placeholder || "e.g. K123456(8)";
          input.value = question.value || "";

          // Attach the event listener for formatting
          input.addEventListener('input', (event) => {
              const formattedValue = formatHkid(event.target.value);
              question.value = formattedValue; // This will trigger onValueChanged
              event.target.value = formattedValue;
          });

          // Add validation on value changed
          question.onValueChanged.add((sender, options) => {
              if (options.value && !validateHkid(options.value)) {
                  question.errors = [new Survey.CustomError("The HKID is not valid.")];
              } else {
                  question.errors = [];
              }
          });

          el.appendChild(input);
      }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = initHkidComponent;
} else if (typeof Survey !== 'undefined') {
  initHkidComponent(Survey);
}
