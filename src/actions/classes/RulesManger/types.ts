import { type RuleGroupType } from "react-querybuilder";

export enum RuleDirection {
  EMIT = "emit", // Use "emitted" when describing the act of producing or broadcasting an event.
  CONSUME = "consume", // Use "consumed" when describing the act of receiving and processing an event.
}

export enum RuleLogicalOperator {
  AND = "and",
  OR = "or",
}

export type TOperator =
  | "equals"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "regex"
  | "exists"
  | "notExists";

export enum RuleActionType {
  TRANSFORM = "transform",
  FILTER = "filter",
  ROUTE = "route",
  LOG = "log",
}

export enum RuleOperator {
  EQUALS = "equals",
  NOT_EQUALS = "notEquals",
  CONTAINS = "contains",
  NOT_CONTAINS = "notContains",
  STARTS_WITH = "startsWith",
  ENDS_WITH = "endsWith",
  IS_EMPTY = "null",
  NOT_IS_EMPTY = "notNull",
  REGEX = "regex",
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  eventType: string;
  direction: RuleDirection;
  targetBrands: string[];
  conditions: RuleGroupType;
  actions: RuleAction[];
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleAction {
  type: RuleActionType;
  target?: string;
  parameters?: Record<string, any>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  matched: boolean;
  actions: RuleAction[];
  executionTime: number;
}
