import { ActionButton } from "@adobe/react-spectrum";

import { ActionProps } from "react-querybuilder";

export const AddGroupAction = (props:ActionProps) => (
    <ActionButton onPress={() => props.handleOnClick(undefined, props.context)}>
        + Group
    </ActionButton>
);