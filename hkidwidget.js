// Ensure SurveyJS Core is available
if (typeof Survey !== 'undefined') {
    const CUSTOM_QUESTION_TYPE = "hkid";

    // --- HKID Validation Logic ---
    function calculateHKIDCheckDigit(prefix) {
    prefix = prefix.toUpperCase().trim();
    // Validate format: 1 or 2 letters followed by 6 digits.
    if (!/^[A-Z]{1,2}[0-9]{6}$/.test(prefix)) return null;

    const weights = [9, 8, 7, 6, 5, 4, 3, 2]; // Weights for 8 positions
    let sum = 0;
    let pLen = prefix.length;

    // Handle the first character (always a letter for valid HKID prefixes)
    // For single letter prefix (e.g. A123456), it's like ' A123456' for calculation if using fixed 9-char system.
    // Or, more directly, map letters to values and sum up based on actual characters present.
    // Current implementation uses weights relative to the start of the 8 significant chars.

    // Character values: Space = (not typically used, often 0 or skip), A=10, B=11, ..., Z=35
    // The provided implementation seems to use weights 9,8,7,6,5,4,3,2 directly on the 7 or 8 chars.

    if (pLen === 7) { // Single letter prefix: L N N N N N N
        sum += (prefix.charCodeAt(0) - 'A'.charCodeAt(0) + 10) * weights[0]; // Letter part
        for (let i = 0; i < 6; i++) { // Numeric part
            sum += parseInt(prefix.charAt(i + 1)) * weights[i + 1];
        }
    } else { // Double letter prefix: L L N N N N N N
        sum += (prefix.charCodeAt(0) - 'A'.charCodeAt(0) + 10) * weights[0]; // First Letter
        sum += (prefix.charCodeAt(1) - 'A'.charCodeAt(0) + 10) * weights[1]; // Second Letter
        for (let i = 0; i < 6; i++) { // Numeric part
            sum += parseInt(prefix.charAt(i + 2)) * weights[i + 2];
        }
    }

    const remainder = sum % 11;
    if (remainder === 0) return "0";

    const checkVal = 11 - remainder;
    if (checkVal === 10) return "A";
    // if (checkVal === 11) return "0"; // This is covered by remainder === 0
    return checkVal.toString();
}

    function isValidHKID(hkidPrefix, checkDigit) {
        if (Survey.Helpers.isValueEmpty(hkidPrefix) && Survey.Helpers.isValueEmpty(checkDigit)) {
            return { valid: true, isempty: true }; // Valid if both are empty, but mark as empty
        }
        if (Survey.Helpers.isValueEmpty(hkidPrefix) || Survey.Helpers.isValueEmpty(checkDigit)) {
             return { valid: false, error: "Both HKID prefix and check digit must be provided." };
        }

        hkidPrefix = String(hkidPrefix).toUpperCase();
        checkDigit = String(checkDigit).toUpperCase();

        const prefixRegex = /^[A-Z]{1,2}\d{6}$/;
        if (!prefixRegex.test(hkidPrefix)) {
            return { valid: false, error: "Invalid HKID prefix format. Expected 1 or 2 letters followed by 6 digits." };
        }

        const checkDigitRegex = /^[0-9A]$/;
        if (!checkDigitRegex.test(checkDigit)) {
            return { valid: false, error: "Invalid check digit format. Expected a single digit (0-9) or 'A'." };
        }

        const calculatedCheckDigit = calculateHKIDCheckDigit(hkidPrefix);

        if (calculatedCheckDigit === null) {
            // This case should ideally be caught by the prefixRegex test earlier,
            // but as a fallback:
            return { valid: false, error: "Could not calculate check digit due to invalid prefix format." };
        }

        if (calculatedCheckDigit === checkDigit) {
            return { valid: true };
        } else {
            return { valid: false, error: `Invalid HKID. Calculated check digit is ${calculatedCheckDigit}, but provided ${checkDigit}.` };
        }
    }

    class HKIDValidator extends Survey.SurveyValidator {
        getType() {
            return "hkidvalidator";
        }

        validate(value, name = null) {
            // Value is expected to be { hkidPrefix: "...", checkDigit: "..." }
            if (!value) { // Should not happen if question value is correctly structured
                return new Survey.ValidatorResult(null, false, this.getErrorText("HKID value is missing."));
            }

            const { hkidPrefix, checkDigit } = value;
            const isEmptyPrefix = Survey.Helpers.isValueEmpty(hkidPrefix);
            const isEmptyCheckDigit = Survey.Helpers.isValueEmpty(checkDigit);

            // If the question is not required, and both fields are empty, it's valid.
            if (!this.question.isRequired && isEmptyPrefix && isEmptyCheckDigit) {
                return new Survey.ValidatorResult(value, true);
            }

            // If one part is filled and the other is not (and not covered by isRequired check)
            if (isEmptyPrefix && !isEmptyCheckDigit) {
                return new Survey.ValidatorResult(value, false, this.getErrorText("HKID prefix is missing."));
            }
            if (!isEmptyPrefix && isEmptyCheckDigit) {
                 return new Survey.ValidatorResult(value, false, this.getErrorText("HKID check digit is missing."));
            }
             // If both are empty but question is required
            if (this.question.isRequired && isEmptyPrefix && isEmptyCheckDigit) {
                return new Survey.ValidatorResult(value, false, this.question.requiredText || this.getErrorText(this.question.locRequiredError.text));
            }


            const validationResult = isValidHKID(hkidPrefix, checkDigit);
            if (validationResult.valid) {
                return new Survey.ValidatorResult(value, true);
            } else {
                return new Survey.ValidatorResult(value, false, this.getErrorText(validationResult.error || "HKID is invalid."));
            }
        }

        getDefaultErrorText(name) {
            // 'name' here could be the specific error message from isValidHKID
            return name || "HKID is invalid.";
        }
    }

    Survey.Serializer.addClass(
        "hkidvalidator",
        [], // no specific properties for this validator in the serializer
        function () { return new HKIDValidator(); },
        "surveyvalidator"
    );

    // 1. Define the new question type class
    class QuestionHKIDModel extends Survey.Question {
        constructor(name) {
            super(name);
            this.createProperty("hkidPrefix", "");
            this.createProperty("checkDigit", "");

            this.onPropertyChanged.add((sender, options) => {
                if (options.name === "hkidPrefix" || options.name === "checkDigit") {
                    super.setValue(this.getValue());
                }
            });
        }

        getType() {
            return CUSTOM_QUESTION_TYPE;
        }

        getValue() {
            return {
                hkidPrefix: this.getPropertyValue("hkidPrefix"),
                checkDigit: this.getPropertyValue("checkDigit")
            };
        }

        setValue(newValue) {
            if (newValue && typeof newValue === 'object') {
                this.setPropertyValue("hkidPrefix", newValue.hkidPrefix || "");
                this.setPropertyValue("checkDigit", newValue.checkDigit || "");
            } else {
                this.setPropertyValue("hkidPrefix", "");
                this.setPropertyValue("checkDigit", "");
            }
            super.setValue(this.getValue());
        }

        isEmpty() {
            const val = this.getValue();
            return Survey.Helpers.isValueEmpty(val.hkidPrefix) && Survey.Helpers.isValueEmpty(val.checkDigit);
        }
    }

    Survey.Serializer.addClass(
        CUSTOM_QUESTION_TYPE,
        [
            { name: "hkidPrefix:text", serializationProperty: "hkidPrefix", displayName: "HKID Prefix" },
            { name: "checkDigit:text", maxLength: 1, serializationProperty: "checkDigit", displayName: "Check Digit" },
            // Expose validators array to the serializer if you want to allow configuring validators in JSON
            // For this case, we are auto-adding it, so direct serialization might not be needed unless for advanced customization.
            // { name: "validators:validators", className: "svyvalidator", baseClassName: "surveyvalidator" }
        ],
        function () {
            const question = new QuestionHKIDModel("");
            // Automatically add HKIDValidator to each instance of QuestionHKIDModel
            question.validators.push(new HKIDValidator());
            return question;
        },
        "question"
    );

    if (typeof Survey !== 'undefined' && Survey.koQuestionFactory) {
        Survey.Serializer.addProperty(CUSTOM_QUESTION_TYPE, {
            name: "placeHolderPrefix",
            default: "e.g. A123456 or AB123456",
            category: "general",
            displayName: "Prefix Placeholder"
        });
        Survey.Serializer.addProperty(CUSTOM_QUESTION_TYPE, {
            name: "placeHolderCheckDigit",
            default: "e.g. 0-9, A",
            category: "general",
            displayName: "Check Digit Placeholder"
        });

        const template = `
            <div>
                <span data-bind=\"text: question.title || 'HKID'\"></span>:
                <input type=\"text\" style=\"margin-left: 5px; margin-right: 5px;\"
                       data-bind=\"value: question.hkidPrefix,
                                  valueUpdate: 'afterkeydown',
                                  attr: {
                                      placeholder: question.placeHolderPrefix,
                                      'aria-label': question.locTitle.renderedText + ' Prefix'
                                  },
                                  css: question.cssClasses.prefixInput || ''\">
                ( <input type=\"text\" style=\"width: 50px;\"
                         data-bind=\"value: question.checkDigit,
                                    valueUpdate: 'afterkeydown',
                                    attr: {
                                        placeholder: question.placeHolderCheckDigit,
                                        maxLength: 1,
                                        'aria-label': question.locTitle.renderedText + ' Check Digit'
                                    },
                                    css: question.cssClasses.checkDigitInput || ''\"> )
                <!-- ko if: question.isReqTextShown() -->
                <span data-bind=\"text: question.requiredText\" style=\"color: red; margin-left: 5px;\"></span>
                <!-- /ko -->
            </div>
        `;
        Survey.koTemplateManager.instance.addTemplate(CUSTOM_QUESTION_TYPE, "question", template);
    } else {
        console.warn("SurveyJS Knockout support not found. HKID widget rendering will rely on default or require manual framework integration for non-Knockout versions.");
    }

    if (typeof SurveyCreator !== 'undefined' && SurveyCreator.Toolbox) {
        SurveyCreator.Toolbox.questionTypes.push({
            name: CUSTOM_QUESTION_TYPE,
            title: "HKID Input",
            iconName: "icon-text",
            json: {
                type: CUSTOM_QUESTION_TYPE,
                name: "hkidInput",
                title: "HKID"
            }
        });

        SurveyCreator.SurveyQuestionEditorDefinition.definition[CUSTOM_QUESTION_TYPE] = {
            properties: [
                "name", "title", "description", "visible", "readOnly", "isRequired", "visibleIf", "enableIf",
                "hkidPrefix", "checkDigit", "placeHolderPrefix", "placeHolderCheckDigit"
            ],
            tabs: [{
                name: "general",
                title: "General",
                properties: [
                    "name", "title", "description", "isRequired",
                    "hkidPrefix", "checkDigit", "placeHolderPrefix", "placeHolderCheckDigit"
                    // "validators" // Add if you want to manage validators in the editor UI for this question type
                ]
            }, {
                name: "logic",
                title: "Logic",
                properties: ["visible", "readOnly", "visibleIf", "enableIf"]
            }]
        };
    }

} else {
    console.error("SurveyJS Core not found. HKID widget cannot be registered.");
}
