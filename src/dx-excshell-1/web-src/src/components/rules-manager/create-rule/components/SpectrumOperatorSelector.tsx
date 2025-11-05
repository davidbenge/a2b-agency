import { Item, Picker } from "@adobe/react-spectrum";
import { OperatorSelectorProps } from "react-querybuilder";

export const SpectrumOperatorSelector = ({
    handleOnChange,
    options,
    value,
  }: OperatorSelectorProps) => {
    return (
      <Picker
        aria-label="Operator"
        selectedKey={value}
        onSelectionChange={(key) => handleOnChange(String(key))}
      >
        {options.map((opt) => (
          <Item key={opt.name}>{opt.label}</Item>
        ))}
      </Picker>
    );
  }