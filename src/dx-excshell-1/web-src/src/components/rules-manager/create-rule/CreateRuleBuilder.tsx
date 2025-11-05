import { useCallback, useState } from "react";

import { Text, Flex, Heading, Divider } from "@adobe/react-spectrum";

import {
  formatQuery,
  QueryBuilder,
  RuleGroupType,
} from "react-querybuilder";

import "react-querybuilder/dist/query-builder.css";
import { controlElements, operators } from "../helpers/validateQuery";

const conditionFields = [
  { name: "size", label: "Size" },
  { name: "owner", label: "Owner" },
  { name: "assetType", label: "Asset Type" },
  { name: "metadata.a2d__customers", label: "Customers" },
  { name: "metadata.a2b__sync_on_change", label: "Sync on Change" },
];




export const CreateRuleBuilder = ({
  onQueryChange,
}: {
  onQueryChange: (query: RuleGroupType) => void;
}) => {
  const [query, setQuery] = useState<RuleGroupType>({
    combinator: "and",
    rules: [],
  });

  const handleQueryChange = useCallback(
    (query: RuleGroupType) => {
      setQuery(query);
      onQueryChange(query);
    },
    [onQueryChange]
  );

  return (
    <Flex direction="column" gap="size-300" width="100%" margin="size-300">
      <Divider size="S" />
      <Heading level={4}>Rule Conditions</Heading>
      <QueryBuilder
        query={query}
        operators={operators}
        fields={conditionFields}
        onQueryChange={handleQueryChange}
        controlElements={controlElements}
        
      />
      <Divider size="S" />
      <Text>
        Rule Conditions JSON Preview for visualizing the rule conditions
      </Text>
      <pre style={{ background: "#f6f6f6", padding: 10, borderRadius: 6 }}>
        <code>{formatQuery(query, "json")}</code>
      </pre>
    </Flex>
  );
};
