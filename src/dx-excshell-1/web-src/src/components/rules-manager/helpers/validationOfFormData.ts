import { isRuleOrGroupValid, RuleGroupType } from "react-querybuilder";
import {
  Rule,
  RuleDirection,
} from "../../../../../../actions/classes/RulesManger/types";
import { validateQuery } from "./validateQuery";

const validationSchema = {
  name: (name: string) => {
    if (!name) {
      return "The Rule Name is required";
    }
    return "";
  },
  eventType: (eventType: string) => {
    if (!eventType) {
      return "The Event Type is required";
    }
    return "";
  },
  direction: (direction: RuleDirection) => {
    if (!direction) {
      return "The Direction is required";
    }
    return "";
  },
  targetBrands: (targetBrands: string[]) => {
    if (!targetBrands.length) {
      return "The Target Brand(s) are required";
    }
    return "";
  },
  conditions: (conditions: RuleGroupType) => {
    return validateQuery(conditions);
  },
  priority: (priority: number) => {
    if (!priority && typeof priority !== "number") {
      return "The Priority is required";
    }
    return "";
  },
};

export const validationOfFormData = (formData: Partial<Rule>) => {
  for (const key in formData) {
    if (validationSchema[key]) {
      const error = validationSchema[key]?.(formData[key]);
      if (error) {
        return error;
      }
    }
  }
  return "";
};
