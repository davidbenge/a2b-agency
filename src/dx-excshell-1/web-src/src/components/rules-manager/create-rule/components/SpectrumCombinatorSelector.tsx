import { Item, Picker } from "@adobe/react-spectrum";
import { CombinatorSelectorProps } from "react-querybuilder";

export const SpectrumCombinatorSelector = ({
    options,
    value,
    handleOnChange,
  }: CombinatorSelectorProps) => {
    return (
      <Picker
        aria-label="Combinator"
        selectedKey={value}
        onSelectionChange={(key) => handleOnChange(String(key))}
      >
        {options.map((opt) => (
          <Item key={opt.name}>{opt.label}</Item>
        ))}
      </Picker>
    );
  }