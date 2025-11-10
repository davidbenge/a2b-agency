import { ActionButton } from "@adobe/react-spectrum";

import { ActionProps } from "react-querybuilder";

export const AddRuleAction = (props:ActionProps) => (
    <ActionButton onPress={() => props.handleOnClick(undefined, props.context)}>
        + Rule
    </ActionButton>
);