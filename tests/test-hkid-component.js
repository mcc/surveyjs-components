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
let validateHkid, formatHkid;

if (typeof process !== 'undefined') { // Node.js environment
    // The component exports the init function, with helpers attached for testing
    const initHkidComponent = require('../js/surveyjs-hkid-component.js');
    validateHkid = initHkidComponent.validateHkid;
    formatHkid = initHkidComponent.formatHkid;

} else { // Browser environment - assuming helpers are exposed on a global for tests
    validateHkid = window.validateHkid;
    formatHkid = window.formatHkid;
}


// --- Tests ---
test("HKID Validation (validateHkid)", () => {
    assertTrue(validateHkid("K123456(0)"), "Valid: K123456(0)");
    assertTrue(validateHkid("k1234560"), "Valid: k1234560 (no parens, lowercase)");
    assertTrue(validateHkid(" KA123456(4) "), "Valid: KA123456(4) with spaces");
    assertTrue(validateHkid("W123456(3)"), "Valid: W123456(3)");

    assertFalse(validateHkid("K123456(7)"), "Invalid checksum");
    assertFalse(validateHkid("K12345(8)"), "Invalid length");
    assertFalse(validateHkid("K12345B(8)"), "Invalid characters in number part");
    assertFalse(validateHkid("K123456(X)"), "Invalid check digit character");
});

test("HKID Formatting (formatHkid)", () => {
    assertEquals(formatHkid("k1234568"), "K123456(8)", "Simple case");
    assertEquals(formatHkid("ka1234564"), "KA123456(4)", "Double letter prefix");
    assertEquals(formatHkid("k123 456 8"), "K123456(8)", "With spaces");
    assertEquals(formatHkid("k123456(8)"), "K123456(8)", "With parens already");
});


// Run tests
runTests();
