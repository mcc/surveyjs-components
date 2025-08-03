// --- HKID Validation Logic ---
const calculateHkidCheckDigit = (candidate) => {
  const hkid = candidate.toUpperCase();
  const charPart = hkid.match(/^([A-Z]{1,2})/)[1];
  const numPart = hkid.match(/(\d{6})$/)[1];
  const strValidChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let checkSum = 0;

  if (charPart.length === 2) {
    checkSum += 9 * (10 + strValidChars.indexOf(charPart[0]));
    checkSum += 8 * (10 + strValidChars.indexOf(charPart[1]));
  } else {
    checkSum += 9 * 36; // space = 36
    checkSum += 8 * (10 + strValidChars.indexOf(charPart[0]));
  }

  for (var i = 0; i < numPart.length; i++) {
    checkSum += (7 - i) * parseInt(numPart[i], 10);
  }

  var remainder = checkSum % 11;
  if (remainder === 0) return "0";
  if (remainder === 1) return "A";
  return String(11 - remainder);
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
    let prefix = cleaned.match(/^[A-Z]{1,2}/);
    if(!prefix) return cleaned;
    prefix = prefix[0];
    let numbers = cleaned.substring(prefix.length);
    if(numbers.length > 6) {
        let checkdigit = numbers.substring(6, 7); // Only take the first char for the check digit
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
              question.value = formattedValue;
              event.target.value = formattedValue;
          });

          // Add validation on the survey instance, but only once
          if (question.survey && !question.survey.hasHkidValidator) {
            question.survey.onValidateQuestion.add((sender, options) => {
                if (options.question.getType() === "hkid") {
                    if (options.value && !validateHkid(options.value)) {
                        options.error = "The HKID is not valid.";
                    }
                }
            });
            question.survey.hasHkidValidator = true;
          }

          el.appendChild(input);
      }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = initHkidComponent;
} else if (typeof Survey !== 'undefined') {
  initHkidComponent(Survey);
}
