function initHkidComponent(Survey) {
  // HKID validation logic (reused and adapted)
  // const hkidRegexForValidation = /^([A-Z]{1,2})([0-9]{6})([0-9A])$/; // For validating combined parts

  const getHkidValue = (char) => {
    const charCode = char.charCodeAt(0);
    if (char === " ") {
      return 36;
    } else if (!isNaN(parseInt(char))) {
      return parseInt(char);
    } else if (charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0)) {
      return charCode - "A".charCodeAt(0) + 10;
    }
    return 0;
  };

  const calculateHkidCheckDigit = (candidate) => {
    let sum = 0;
    const preparedCandidate = candidate.toUpperCase().padStart(8, ' ');

    for (let i = 0; i < 8; i++) {
      const weight = 9 - i;
      const value = getHkidValue(preparedCandidate[i]);
      sum += (weight * value);
    }

    let remainder = sum % 11;
    if (remainder === 0) {
      return "0";
    } else if (remainder === 10) {
      return "A";
    } else {
      return (11 - remainder).toString();
    }
  };

  const validateHkidParts = (mainPart, checkDigitValue) => {
    if (!mainPart || !checkDigitValue) return false;

    const mainPartUpper = mainPart.toUpperCase();
    const mainPartMatch = mainPartUpper.match(/^([A-Z]{1,2})([0-9]{6})$/);
    if (!mainPartMatch) {
      console.log("Main part regex fail", mainPartUpper);
      return false;
    }

    const checkDigitUpper = checkDigitValue.toUpperCase();
    if (!checkDigitUpper.match(/^[0-9A]$/)) {
      console.log("Check digit regex fail", checkDigitUpper);
      return false;
    }

    const prefix = mainPartMatch[1];
    const digits = mainPartMatch[2];

    const calculatedCheckDigit = calculateHkidCheckDigit(prefix + digits);
    return checkDigitUpper === calculatedCheckDigit;
  };

  Survey.ComponentCollection.Instance.add({
    name: "hkid",
    title: "身份證號碼", // Main title for the entire component
    questionTitleTemplate: "{title} {no}",
    elementsJSON: [
      {
        type: "html",
        name: "hkid_prefix_label",
        html: "<span class='hkid-composite-label'>括號內數字</span><span class='hkid-bracket'> [</span>"
      },
      {
        type: "text",
        name: "hkid_main",
        titleLocation: "hidden",
        placeholder: "A123456",
        isRequired: true,
        maxLength: 8,
        // Mask 'a#######' means 'a' or 'A' followed by any 7 chars (letter or digit).
        // This is loose. A stricter mask for common format: 'a999999'
        // If two letters are possible: 'aa999999'
        // The current validation allows 1 or 2 letters. Masking this precisely is hard.
        // Using a simpler mask and relying on validation.
        maskType: "pattern",
        maskSettings: { pattern: "a999999" }, // Assuming common single letter prefix for mask
                                            // Validation will handle two letters.
        startWithNewLine: false,
        cssClasses: { root: "hkid-main-input" }
      },
      {
        type: "html",
        name: "hkid_middle_label",
        html: "<span class='hkid-bracket'>]</span><span class='hkid-bracket hkid-paren'>(</span>"
      },
      {
        type: "text",
        name: "hkid_checkdigit",
        titleLocation: "hidden",
        placeholder: "3",
        isRequired: true,
        maxLength: 1,
        maskType: "pattern",
        maskSettings: { pattern: "#" }, // # allows digit or letter (for 'A')
        startWithNewLine: false,
        cssClasses: { root: "hkid-checkdigit-input" }
      },
      {
        type: "html",
        name: "hkid_suffix_label",
        html: "<span class='hkid-bracket hkid-paren'>)</span>"
      }
    ],
    onLoaded(question) {
        // Access internal questions
        const hkidMainQuestion = question.contentPanel.getQuestionByName("hkid_main");
        const hkidCheckDigitQuestion = question.contentPanel.getQuestionByName("hkid_checkdigit");

        // Force uppercase for hkid_main (first letter)
        if (hkidMainQuestion) {
            hkidMainQuestion.registerFunctionOnPropertyValueChanged("value", (newValue) => {
                if (newValue && typeof newValue === 'string' && newValue.length > 0) {
                    const firstChar = newValue.substring(0,1);
                    const rest = newValue.substring(1);
                    const firstCharUpper = firstChar.toUpperCase();
                    if(firstChar !== firstCharUpper) {
                        hkidMainQuestion.value = firstCharUpper + rest;
                    }
                }
            });
        }
    },
    onValueChanged: (question, name, newValue) => {
      // This is called when hkid_main or hkid_checkdigit changes.
      // `question.value` is the composite object { hkid_main: ..., hkid_checkdigit: ... }
      // Could be used for dynamic updates between parts if needed in future.
    }
  });

  if (Survey.SurveyModel && Survey.SurveyModel.prototype.onValidateQuestion) {
    Survey.SurveyModel.prototype.onValidateQuestion.add((sender, options) => {
      if (options.question.getType() === "hkid") {
        const hkidValue = options.value;

        if (!hkidValue || !hkidValue.hkid_main || !hkidValue.hkid_checkdigit) {
          if (options.question.isRequired) {
            options.error = "請填寫完整的身份證號碼及括號內數字。";
            return;
          }
        }

        if (hkidValue && hkidValue.hkid_main && hkidValue.hkid_checkdigit) {
          if (!validateHkidParts(hkidValue.hkid_main, hkidValue.hkid_checkdigit)) {
            options.error = "無效的香港身份證號碼或校驗碼。";
          }
        } else if (options.question.isRequired) {
            // This case handles if the question is required, but one of the parts might be missing,
            // and was not caught by the initial check (e.g. one part filled, other programmatically cleared).
            options.error = "請填寫完整的身份證號碼及括號內數字。";
        }
      }
    });
  } else {
    console.warn("Survey.SurveyModel.prototype.onValidateQuestion not found. HKID validation might not be active.");
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = initHkidComponent;
} else if (typeof Survey !== 'undefined') {
  initHkidComponent(Survey);
}

// Add some basic CSS for layout (users should ideally put this in their stylesheet)
// This is just a helper to make it look closer to the requirement out-of-the-box.
// It's generally better to handle styling in a separate CSS file.
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    /* Try to make HTML elements and text inputs align nicely */
    .sv-question__content .sv-question__content--left > *:not(.sv-question__title) {
        display: inline-block;
        vertical-align: middle; /* Align items vertically */
    }
    .sv-question__content .sv-question__content--left > .hkid-main-input,
    .sv-question__content .sv-question__content--left > .hkid-checkdigit-input {
        max-width: 150px; /* Adjust as needed */
    }
    .sv-question__content .sv-question__content--left > .hkid-checkdigit-input {
        max-width: 50px; /* Adjust for check digit */
    }
    .hkid-composite-label { margin-right: 5px; }
    .hkid-bracket {
        font-size: 1em; /* Match surrounding text */
        /* No bold by default, but can be added */
    }
    .hkid-bracket.hkid-paren {
        /* Specific styling for parentheses if needed */
    }
    /* Ensure inputs themselves don't have excessive margins */
    .sv-question__content .sv-text, .sv-question__content .sv-html {
      margin-right: 0px !important; /* Override default SurveyJS spacing if too large */
      margin-left: 0px !important;
      padding-right: 2px !important; /* Minimal padding */
      padding-left: 2px !important;
    }
  `;
  document.getElementsByTagName('head')[0].appendChild(style);
}
