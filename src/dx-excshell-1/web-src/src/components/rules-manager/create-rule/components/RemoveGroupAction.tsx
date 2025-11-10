import { ActionButton, Text } from "@adobe/react-spectrum";
import DeleteOutline from "@spectrum-icons/workflow/DeleteOutline";
import { ActionProps } from "react-querybuilder";

export const RemoveGroupAction = (props:ActionProps) => (
    <ActionButton onPress={() => props.handleOnClick(undefined, props.context)}>
        <DeleteOutline />
        <Text>Remove Group</Text>
    </ActionButton>
);