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

function runTests() {
    let passed = 0;
    let failed = 0;
    console.log("Running New HKID Component Tests...");

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
        currentTestName = "";
    });

    console.log("\n--- Test Summary ---");
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log("--------------------");

    if (failed > 0) {
        console.error("HKID COMPONENT TESTS FAILED.");
        if(typeof process !== 'undefined') process.exit(1);
    } else {
        console.log("HKID COMPONENT TESTS PASSED.");
    }
    return failed === 0;
}

// Environment setup for Node.js vs Browser
let Survey;
let validateHkid, QuestionHkidModel, initHkidComponent;


if (typeof process !== 'undefined') { // Node.js environment
    const component = require('../js/surveyjs-hkid-component.js');
    initHkidComponent = component;
    validateHkid = component.validateHkid;

    // Mock SurveyJS for Node.js testing
    Survey = {
        QuestionTextModel: class { constructor() { this.validators = []; } afterRender() {} },
        SurveyValidator: class { getErrorText(text) { return text; } },
        ValidatorResult: class { constructor(v, s, e) { this.value = v; this.isSuccess = s; this.error = e; } },
        Serializer: { addClass: () => {} },
    };
    global.Survey = Survey;

    // Initialize the component to register classes
    initHkidComponent(Survey);
    // Now the model is registered, we can get it
    QuestionHkidModel = Survey.QuestionHkidModel;

} else { // Browser environment
    Survey = window.Survey;
    validateHkid = window.validateHkid;
    QuestionHkidModel = window.QuestionHkidModel;
}


// --- Tests ---
test("HKID Validation (validateHkid)", () => {
    assertTrue(validateHkid("K123456(8)"), "Valid: K123456(8)");
    assertTrue(validateHkid("k1234568"), "Valid: k1234568 (no parens, lowercase)");
    assertTrue(validateHkid(" KA123456(4) "), "Valid: KA123456(4) with spaces");
    assertTrue(validateHkid("W123456A"), "Valid: W123456A (check digit A)");

    assertFalse(validateHkid("K123456(7)"), "Invalid checksum");
    assertFalse(validateHkid("K12345(8)"), "Invalid length");
    assertFalse(validateHkid("K12345B(8)"), "Invalid characters in number part");
    assertFalse(validateHkid("K123456(X)"), "Invalid check digit character");
});

test("HKID Formatting (QuestionHkidModel.formatHkid)", () => {
    const question = new QuestionHkidModel("test");
    assertEquals(question.formatHkid("k1234568"), "K123456(8)", "Simple case");
    assertEquals(question.formatHkid("ka1234564"), "KA123456(4)", "Double letter prefix");
    assertEquals(question.formatHkid("k123 456 8"), "K123456(8)", "With spaces");
    assertEquals(question.formatHkid("k123456(8)"), "K123456(8)", "With parens already");
});

test("SurveyJS Validator (HkidValidator)", () => {
    const question = new QuestionHkidModel("test_hkid");
    const validator = question.validators[0];

    validator.question = { isRequired: true };

    let result = validator.validate("K123456(8)");
    assertTrue(result.isSuccess, "Validator should pass for valid HKID");

    result = validator.validate("K123456(7)");
    assertFalse(result.isSuccess, "Validator should fail for invalid HKID");
});


// Run tests
runTests();
