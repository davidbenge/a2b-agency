import { Item, Picker } from "@adobe/react-spectrum";
import { FieldSelectorProps } from "react-querybuilder";

export const SpectrumFieldSelector = ({
    options,
    value,
    handleOnChange,
}: FieldSelectorProps) => {
    return (
        <Picker
            aria-label="Field"
            selectedKey={value}
            onSelectionChange={(key) => handleOnChange(String(key))}
        >
            {options.map((opt) => (
                <Item key={opt.name}>{opt.label}</Item>
            ))}
        </Picker>
    );
}