/**
 * Property-Based Tests for Default Delete Rules Structure Validity
 * 
 * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * Property: For any default rule created by the system, the rule SHALL have:
 * a numeric priority field, a positive fitTime value greater than 0,
 * a non-empty Chinese alias string, and type set to "normal".
 */

const fc = require('fast-check');

// Mock logger to prevent console output during tests
jest.mock('../../app/libs/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const { getDefaultRuleDefinitions } = require('../../app/libs/defaultDeleteRules');

describe('Default Delete Rules Structure Validity', () => {
  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any default rule, the priority field SHALL be a number.
   */
  test('Property 3: all rules have numeric priority field', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => typeof rule.priority === 'number');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any default rule, the fitTime field SHALL be a positive number greater than 0.
   */
  test('Property 3: all rules have positive fitTime value', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => 
          typeof rule.fitTime === 'number' && rule.fitTime > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any default rule, the alias field SHALL be a non-empty Chinese string.
   */
  test('Property 3: all rules have non-empty Chinese alias', () => {
    // Chinese character regex pattern
    const chinesePattern = /[\u4e00-\u9fa5]/;
    
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => 
          typeof rule.alias === 'string' && 
          rule.alias.length > 0 &&
          chinesePattern.test(rule.alias)
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any default rule, the type field SHALL be set to "normal".
   */
  test('Property 3: all rules have type set to normal', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => rule.type === 'normal');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any default rule, all required fields SHALL be present.
   */
  test('Property 3: all rules have all required fields', () => {
    const requiredFields = [
      'alias', 'type', 'priority', 'fitTime', 'deleteNum', 
      'pause', 'onlyDeleteTorrent', 'limitSpeed', 'conditions'
    ];
    
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => 
          requiredFields.every(field => rule.hasOwnProperty(field))
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any default rule, conditions SHALL be a non-empty array.
   */
  test('Property 3: all rules have non-empty conditions array', () => {
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => 
          Array.isArray(rule.conditions) && rule.conditions.length > 0
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: default-delete-rules, Property 3: Rule Structure Validity**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * Property: For any condition in any default rule, it SHALL have key, compareType, and value fields.
   */
  test('Property 3: all conditions have required fields', () => {
    const conditionFields = ['key', 'compareType', 'value'];
    
    fc.assert(
      fc.property(fc.constant(getDefaultRuleDefinitions()), (rules) => {
        return rules.every(rule => 
          rule.conditions.every(condition =>
            conditionFields.every(field => condition.hasOwnProperty(field))
          )
        );
      }),
      { numRuns: 100 }
    );
  });
});
