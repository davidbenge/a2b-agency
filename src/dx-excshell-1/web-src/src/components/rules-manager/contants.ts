import { isRuleOrGroupValid, RuleGroupType } from "react-querybuilder";
import { RuleDirection } from "../../../../../actions/classes/RulesManger/types";

export const validationSchema = {
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
    if (!isRuleOrGroupValid(conditions) || conditions.rules.length === 0) {
      return "The Rule Conditions are required";
    }
    return "";
  },
  priority: (priority: number) => {
    if (!priority && typeof priority !== "number") {
      return "The Priority is required";
    }
    return "";
  },
};
