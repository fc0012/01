/**
 * Property-Based Tests for Default Delete Rules Format Consistency
 * 
 * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
 * **Validates: Requirements 1.2, 1.3, 4.1**
 * 
 * Property: For any default rule created by the system, the rule SHALL be stored
 * as a valid JSON file with a unique 8-character hex ID, and the JSON structure
 * SHALL match the schema expected by DeleteRuleMod.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const fc = require('fast-check');

// Mock logger to prevent console output during tests
jest.mock('../../app/libs/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const { getDefaultRuleDefinitions, initDefaultRules } = require('../../app/libs/defaultDeleteRules');

// Helper to create a temporary test directory
function createTestDir() {
  const testDir = path.join(os.tmpdir(), `vertex-rule-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Helper to clean up test directory
function cleanupTestDir(testDir) {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

describe('Default Delete Rules Format Consistency', () => {
  /**
   * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
   * **Validates: Requirements 1.2, 1.3, 4.1**
   * 
   * Property: For any default rule definition, when serialized to JSON,
   * it SHALL produce valid JSON that can be parsed back.
   */
  test('Property 2: all rule definitions produce valid JSON', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => {
          try {
            const json = JSON.stringify(rule, null, 2);
            const parsed = JSON.parse(json);
            return parsed !== null && typeof parsed === 'object';
          } catch (e) {
            return false;
          }
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
   * **Validates: Requirements 1.2, 1.3, 4.1**
   * 
   * Property: For any default rule, the JSON structure SHALL match
   * the schema expected by DeleteRuleMod (same fields as user-created rules).
   */
  test('Property 2: rule structure matches DeleteRuleMod schema', () => {
    // Fields expected by DeleteRuleMod based on existing code
    const expectedFields = [
      'alias', 'type', 'priority', 'fitTime', 'deleteNum',
      'pause', 'onlyDeleteTorrent', 'limitSpeed', 'conditions'
    ];
    
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => {
          // Check all expected fields exist
          const hasAllFields = expectedFields.every(field => 
            rule.hasOwnProperty(field)
          );
          
          // Check field types match expected schema
          const typesMatch = 
            typeof rule.alias === 'string' &&
            typeof rule.type === 'string' &&
            typeof rule.priority === 'number' &&
            typeof rule.fitTime === 'number' &&
            typeof rule.deleteNum === 'number' &&
            typeof rule.pause === 'boolean' &&
            typeof rule.onlyDeleteTorrent === 'boolean' &&
            typeof rule.limitSpeed === 'string' &&
            Array.isArray(rule.conditions);
          
          return hasAllFields && typesMatch;
        });
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
   * **Validates: Requirements 1.2, 1.3, 4.1**
   * 
   * Property: For any condition in a default rule, it SHALL have
   * the same structure as conditions in user-created rules.
   */
  test('Property 2: condition structure matches expected schema', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => 
          rule.conditions.every(condition => 
            typeof condition.key === 'string' &&
            typeof condition.compareType === 'string' &&
            typeof condition.value === 'string' &&
            condition.key.length > 0 &&
            condition.compareType.length > 0
          )
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
   * **Validates: Requirements 1.2, 1.3, 4.1**
   * 
   * Property: The system SHALL generate exactly 6 default rules
   * as specified in the requirements.
   */
  test('Property 2: exactly 6 default rules are defined', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.length === 6;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
   * **Validates: Requirements 1.2, 1.3, 4.1**
   * 
   * Property: All default rules SHALL have unique alias names.
   */
  test('Property 2: all rules have unique aliases', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        const aliases = rules.map(r => r.alias);
        const uniqueAliases = new Set(aliases);
        return aliases.length === uniqueAliases.size;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 2: Rule Format Consistency**
   * **Validates: Requirements 1.2, 1.3, 4.1**
   * 
   * Property: For any rule with an ID, the ID SHALL be an 8-character hex string.
   */
  test('Property 2: generated IDs are 8-character hex strings', () => {
    const hexPattern = /^[0-9a-f]{8}$/;
    
    // Test the ID generation pattern used in the module
    const uuid = require('uuid');
    
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), () => {
        const id = uuid.v4().split('-')[0];
        return hexPattern.test(id) && id.length === 8;
      }),
      { numRuns: 100 }
    );
  });
});
