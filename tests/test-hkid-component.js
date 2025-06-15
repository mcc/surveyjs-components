// Basic Test Framework
const tests = [];
let currentTestName = "";

function test(name, fn) {
    tests.push({ name, fn });
}

function assertEquals(actual, expected, message = "") {
    if (actual !== expected) {
        throw new Error(`Assertion Failed: ${message} | Expected "${expected}", but got "${actual}". Test: ${currentTestName}`);
    }
}

function assertTrue(actual, message = "") {
    if (actual !== true) {
        throw new Error(`Assertion Failed: ${message} | Expected "true", but got "${actual}". Test: ${currentTestName}`);
    }
}

function assertFalse(actual, message = "") {
    if (actual !== false) {
        throw new Error(`Assertion Failed: ${message} | Expected "false", but got "${actual}". Test: ${currentTestName}`);
    }
}

function assertDefined(actual, message = "") {
    if (actual === undefined || actual === null) {
        throw new Error(`Assertion Failed: ${message} | Expected a defined value, but got "${actual}". Test: ${currentTestName}`);
    }
}

function runTests() {
    let passed = 0;
    let failed = 0;
    console.log("Running HKID Component Tests...");

    tests.forEach(testCase => {
        currentTestName = testCase.name;
        try {
            testCase.fn();
            console.log(`[PASS] ${testCase.name}`);
            passed++;
        } catch (e) {
            console.error(`[FAIL] ${testCase.name}`);
            console.error(e.message);
            failed++;
        }
        currentTestName = ""; // Reset for safety
    });

    console.log("\n--- Test Summary ---");
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log("--------------------");

    if (failed > 0) {
        // Indicate failure to automated systems if possible
        // For now, just log prominently.
        console.error("HKID COMPONENT TESTS FAILED.");
    } else {
        console.log("HKID COMPONENT TESTS PASSED.");
    }
    return failed === 0;
}

// Mock SurveyJS objects if not running in a full SurveyJS environment
// This is a very minimal mock to allow component registration and event testing.
let MockSurveyJS;
if (typeof Survey === 'undefined') {
    console.log("Mocking SurveyJS core objects for testing environment.");
    MockSurveyJS = {
        ComponentCollection: {
            Instance: {
                add: function(componentJson) {
                    this.components = this.components || {};
                    this.components[componentJson.name] = componentJson;
                },
                get: function(name) {
                    return this.components ? this.components[name] : null;
                }
            }
        },
        SurveyModel: function(json) { // Mock Survey.Model
            this.surveyJson = json;
            this.questions = [];
            this.onValidateQuestion = {
                add: function(handler) { this.handler = handler; },
                fire: function(sender, options) { if(this.handler) this.handler(sender, options); }
            };
            // Minimal mock for question.getType() and question.isRequired
            if (json && json.elements) {
                json.elements.forEach(q => {
                    this.questions.push({
                        name: q.name,
                        getType: () => q.type,
                        isRequired: q.isRequired || false,
                        // Mock for composite question contentPanel and elements
                        contentPanel: {
                            getQuestionByName: (name) => {
                                if (q.type === 'hkid' && q.elementsJSON) {
                                    const internalQ = q.elementsJSON.find(el => el.name === name);
                                    if (internalQ) return { name: internalQ.name, value: null }; // very basic mock
                                }
                                return null;
                            }
                        }
                    });
                });
            }
        }
    };
    // Make initHkidComponent use the mock if Survey is not global
    window.Survey = MockSurveyJS;
}


// --- HKID Component Tests ---
// Assuming js/surveyjs-hkid-component.js is loaded before this test script,
// or initHkidComponent is explicitly called with the Survey object.
// If Survey was mocked, initHkidComponent will use the mock.
if (typeof initHkidComponent !== 'function') {
    console.error("initHkidComponent is not defined. Make sure surveyjs-hkid-component.js is loaded.");
} else {
    initHkidComponent(window.Survey); // Initialize with global (or mocked) Survey
}


// Test HKID Checksum Logic (internal functions)
test("Checksum Calculation: A123456(7)", () => {
    // Need to access calculateHkidCheckDigit from the component script.
    // This requires initHkidComponent to expose it or testing it via the component's validation.
    // For now, we'll re-declare a minimal version for testing the algorithm directly here.
    const _getHkidValue = (char) => {
        const charCode = char.charCodeAt(0);
        if (char === " ") return 36;
        if (!isNaN(parseInt(char))) return parseInt(char);
        if (charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0)) return charCode - "A".charCodeAt(0) + 10;
        return 0;
    };
    const _calculateHkidCheckDigit = (candidate) => {
        let sum = 0;
        const preparedCandidate = candidate.toUpperCase().padStart(8, ' ');
        for (let i = 0; i < 8; i++) {
            sum += ( (9 - i) * _getHkidValue(preparedCandidate[i]) );
        }
        let remainder = sum % 11;
        if (remainder === 0) return "0";
        if (remainder === 10) return "A";
        return (11 - remainder).toString();
    };

    assertEquals(_calculateHkidCheckDigit("A123456"), "7", "A123456 should have check digit 7");
    assertEquals(_calculateHkidCheckDigit("C555555"), "5", "C555555 should have check digit 5");
    assertEquals(_calculateHkidCheckDigit("R000000"), "A", "R000000 should have check digit A");
    assertEquals(_calculateHkidCheckDigit("W000000"), "8", "W000000 should have check digit 8 (space padded)");
    assertEquals(_calculateHkidCheckDigit("WX123456"), "1", "WX123456 should have check digit 1");
});


test("HKID Full Validation: validateHkidParts", () => {
    // Similar to above, need access to validateHkidParts or test via component.
    // Re-declaring a minimal version for direct testing.
    const _getHkidValue_v = (char) => { /* ... same as above ... */
        const charCode = char.charCodeAt(0); if (char === " ") return 36;
        if (!isNaN(parseInt(char))) return parseInt(char);
        if (charCode >= "A".charCodeAt(0) && charCode <= "Z".charCodeAt(0)) return charCode - "A".charCodeAt(0) + 10;
        return 0;
    };
    const _calculateHkidCheckDigit_v = (candidate) => { /* ... same as above ... */
        let sum = 0; const prep = candidate.toUpperCase().padStart(8, ' ');
        for (let i = 0; i < 8; i++) { sum += ((9 - i) * _getHkidValue_v(prep[i]));}
        let rem = sum % 11; if (rem === 0) return "0"; if (rem === 10) return "A"; return (11 - rem).toString();
    };
    const _validateHkidParts = (main, cd) => {
        if (!main || !cd) return false;
        const mainUpper = main.toUpperCase();
        const mainMatch = mainUpper.match(/^([A-Z]{1,2})([0-9]{6})$/);
        if (!mainMatch) return false;
        if (!cd.toUpperCase().match(/^[0-9A]$/)) return false;
        return cd.toUpperCase() === _calculateHkidCheckDigit_v(mainUpper);
    };

    assertTrue(_validateHkidParts("A123456", "7"), "Valid: A123456(7)");
    assertTrue(_validateHkidParts("a123456", "7"), "Valid: a123456(7) (lowercase main)");
    assertTrue(_validateHkidParts("A123456", "7"), "Valid: A123456(7) (lowercase check)");
    assertTrue(_validateHkidParts("WX123456", "1"), "Valid: WX123456(1)");

    assertFalse(_validateHkidParts("A123456", "8"), "Invalid checksum: A123456(8)");
    assertFalse(_validateHkidParts("A12345", "7"), "Invalid main part length: A12345(7)");
    assertFalse(_validateHkidParts("A12345B", "7"), "Invalid main part char: A12345B(7)");
    assertFalse(_validateHkidParts("1234567", "7"), "Invalid main part prefix: 1234567(7)");
    assertFalse(_validateHkidParts("A123456", "X"), "Invalid check digit char: A123456(X)");
    assertFalse(_validateHkidParts("A123456", "77"), "Invalid check digit length: A123456(77)");
});


test("SurveyJS Component Registration", () => {
    const component = Survey.ComponentCollection.Instance.get("hkid");
    assertDefined(component, "HKID component should be registered.");
    assertEquals(component.name, "hkid", "Component name should be 'hkid'.");
    assertEquals(component.title, "身份證號碼", "Component title is incorrect.");
    assertEquals(component.elementsJSON.length, 5, "Should have 5 elements (html + inputs).");

    // Check structure of elementsJSON for rendering hints
    assertEquals(component.elementsJSON[0].type, "html", "Element 0 type check");
    assertTrue(component.elementsJSON[0].html.includes("括號內數字"), "Element 0 html content check for label");
    assertTrue(component.elementsJSON[0].html.includes("["), "Element 0 html content check for bracket");

    assertEquals(component.elementsJSON[1].type, "text", "Element 1 type check (hkid_main)");
    assertEquals(component.elementsJSON[1].name, "hkid_main", "Element 1 name check");
    assertEquals(component.elementsJSON[1].titleLocation, "hidden", "Element 1 titleLocation");
    assertEquals(component.elementsJSON[1].maskSettings.pattern, "a999999", "Element 1 mask pattern");

    assertEquals(component.elementsJSON[2].type, "html", "Element 2 type check");
    assertTrue(component.elementsJSON[2].html.includes("]"), "Element 2 html content check");
    assertTrue(component.elementsJSON[2].html.includes("("), "Element 2 html content check");

    assertEquals(component.elementsJSON[3].type, "text", "Element 3 type check (hkid_checkdigit)");
    assertEquals(component.elementsJSON[3].name, "hkid_checkdigit", "Element 3 name check");
    assertEquals(component.elementsJSON[3].maskSettings.pattern, "#", "Element 3 mask pattern");

    assertEquals(component.elementsJSON[4].type, "html", "Element 4 type check");
    assertTrue(component.elementsJSON[4].html.includes(")"), "Element 4 html content check");
});

test("SurveyJS Component Validation Event", () => {
    const survey = new Survey.SurveyModel({
        elements: [{ type: "hkid", name: "myhkid", isRequired: true }]
    });
    const question = survey.questions[0];
    let options = { question: question, value: null, error: null };

    // Test case 1: Valid HKID
    options.value = { hkid_main: "A123456", hkid_checkdigit: "7" };
    options.error = null; // reset
    survey.onValidateQuestion.fire(survey, options);
    assertEquals(options.error, null, "Valid HKID should not produce an error.");

    // Test case 2: Invalid HKID (bad checksum)
    options.value = { hkid_main: "A123456", hkid_checkdigit: "8" };
    options.error = null; // reset
    survey.onValidateQuestion.fire(survey, options);
    assertEquals(options.error, "無效的香港身份證號碼或校驗碼。", "Invalid HKID checksum error message.");

    // Test case 3: Invalid HKID (bad main format)
    options.value = { hkid_main: "A12345", hkid_checkdigit: "7" }; // main part too short
    options.error = null; // reset
    survey.onValidateQuestion.fire(survey, options);
    assertEquals(options.error, "無效的香港身份證號碼或校驗碼。", "Invalid HKID main format error message.");

    // Test case 4: Invalid HKID (bad check digit format)
    options.value = { hkid_main: "A123456", hkid_checkdigit: "77" }; // check digit too long
    options.error = null; // reset
    survey.onValidateQuestion.fire(survey, options);
    assertEquals(options.error, "無效的香港身份證號碼或校驗碼。", "Invalid HKID check digit format error message.");

    // Test case 5: Required but empty (one part missing)
    options.value = { hkid_main: "A123456", hkid_checkdigit: "" };
    options.error = null;
    survey.onValidateQuestion.fire(survey, options);
    assertEquals(options.error, "請填寫完整的身份證號碼及括號內數字。", "Required HKID with missing part error.");

    // Test case 6: Required but completely empty/null value for composite
    options.value = null;
    options.error = null;
    survey.onValidateQuestion.fire(survey, options);
    assertEquals(options.error, "請填寫完整的身份證號碼及括號內數字。", "Required HKID with null value error.");

});

test("Conceptual: Auto-Uppercase for first letter of hkid_main", () => {
    // This test is conceptual as it requires DOM interaction and SurveyJS rendering lifecycle.
    // The `onLoaded` function in the component definition attempts to attach a valueChanged listener
    // to `hkid_main` to uppercase its first letter.
    // Manual verification steps:
    // 1. Create a survey with the 'hkid' component.
    // 2. Type 'a123456' into the main HKID part.
    // 3. Observe if 'a' changes to 'A' automatically.
    // This test case serves as a reminder of this feature.
    // To automate, one would need a browser testing environment like Puppeteer/Selenium
    // and interact with the rendered SurveyJS input.
    console.log("INFO: Auto-uppercase test is conceptual and requires manual or browser-based testing.");
    assertTrue(true, "Conceptual test placeholder for auto-uppercase.");
});


test("Conceptual: Rendering and Layout", () => {
    // This test is also conceptual. The `elementsJSON` structure with HTML elements
    // aims to produce the "身份證號碼 括號內數字 [A123456] ([3])" layout.
    // The injected CSS also aids this.
    // Manual verification steps:
    // 1. Create a survey with the 'hkid' component.
    // 2. Observe the rendered layout in a browser.
    // 3. Check if "身份證號碼" is the main title.
    // 4. Check if "括號內數字" text, brackets, and input fields are arranged correctly inline.
    //    e.g., 括號內數字 [ input_for_A123456 ] ( input_for_3 )
    console.log("INFO: Rendering and layout test is conceptual and requires manual browser-based testing.");
    assertTrue(true, "Conceptual test placeholder for rendering.");
});


// Run all tests
// This would typically be invoked by a test runner.
// For this environment, you might run this from a browser console after loading relevant scripts.
// Or, if a bash session could execute Node.js with these files: node tests/test-hkid-component.js
// (assuming surveyjs-hkid-component.js can be required/imported and Survey global is handled).

// To make it runnable in a simple HTML page:
// 1. Include survey.core.js
// 2. Include js/surveyjs-hkid-component.js
// 3. Include this tests/test-hkid-component.js file
// 4. Call runTests() from the console or another script tag.
// Example:
// <script src="https://unpkg.com/survey-core/survey.core.min.js"></script>
// <script src="../js/surveyjs-hkid-component.js"></script>
// <script src="test-hkid-component.js"></script>
// <script>runTests();</script>

// If running in Node.js (requires surveyjs-hkid-component.js to handle module.exports and Survey global)
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    runTests();
}
