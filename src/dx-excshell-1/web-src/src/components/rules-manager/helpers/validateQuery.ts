import { Operator, RuleGroupType, RuleType } from "react-querybuilder";
import { SpectrumOperatorSelector } from "../create-rule/components/SpectrumOperatorSelector";
import { SpectrumCombinatorSelector } from "../create-rule/components/SpectrumCombinatorSelector";
import { SpectrumFieldSelector } from "../create-rule/components/SpectrumFieldSelector";
import { RemoveGroupAction } from "../create-rule/components/RemoveGroupAction";
import { AddRuleAction } from "../create-rule/components/AddRuleAction";
import { AddGroupAction } from "../create-rule/components/AddGroupAction";
import { RemoveRuleAction } from "../create-rule/components/RemoveRuleAction";
import { SpectrumValueEditor } from "../create-rule/components/SpectrumValueEditor";

export const validatorsQueryFields = {
  equals: (value: string) => {
    if (!value) {
      return "The Equals field value is required";
    }
    return "";
  },
  notEquals: (value: string) => {
    if (!value) {
      return "The Not Equals field value is required";
    }
    return "";
  },
  contains: (value: string) => {
    if (!value) {
      return "The Contains field value is required";
    }
    return "";
  },
  notContains: (value: string) => {
    if (!value) {
      return "The Not Contains field value is required";
    }
    return "";
  },
  startsWith: (value: string) => {
    if (!value) {
      return "The Starts With field value is required";
    }
    return "";
  },

  endsWith: (value: string) => {
    if (!value) {
      return "The Ends With field value is required";
    }
    return "";
  },
  isEmpty: (value: string) => {
    if (!value) {
      return "The Is Empty field value is required";
    }
    return "";
  },
  regex: (value: string) => {
    if (!value) {
      return "The Regex field value is required";
    }
    try {
      new RegExp(value);
      return "";
    } catch (e) {
      return "The Regex field value is not a valid regex";
    }
  },
};

export const operators: Operator[] = [
  {
    name: "equals",
    label: "Equals",
  },
  {
    name: "notEquals",
    label: "Not Equals",
  },
  {
    name: "contains",
    label: "Contains",
  },
  {
    name: "notContains",
    label: "Not Contains",
  },
  {
    name: "startsWith",
    label: "Starts With",
  },
  {
    name: "endsWith",
    label: "Ends With",
  },
  { label: "is Empty", name: "null", value: "null" },
  { label: "is not Empty", name: "notNull", value: "notNull" },
  { label: "Regex", name: "regex", value: "regex" },
];

export const controlElements = {
  addRuleAction: AddRuleAction,
  addGroupAction: AddGroupAction,
  valueEditor: SpectrumValueEditor,
  removeRuleAction: RemoveRuleAction,
  fieldSelector: SpectrumFieldSelector,
  removeGroupAction: RemoveGroupAction,
  operatorSelector: SpectrumOperatorSelector,
  combinatorSelector: SpectrumCombinatorSelector,
};

export const validateQuery = (query: RuleGroupType) => {
  const rules = query.rules as RuleType[];
  if (rules.length === 0) {
    return "The Rule Conditions are required";
  }

  for (const rule of rules) {
    if ("rules" in rule && Array.isArray(rule.rules)) {
      const error = validateQuery(rule as unknown as RuleGroupType);
      if (error) {
        return error;
      }
    }

    const validator = validatorsQueryFields[rule.operator];

    const error = validator?.(rule.value) || "";
    if (error) {
      return error;
    }
  }

  return "";
};
