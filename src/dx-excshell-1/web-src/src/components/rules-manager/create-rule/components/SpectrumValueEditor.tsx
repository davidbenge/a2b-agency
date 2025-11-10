import { TextField } from "@adobe/react-spectrum";
import { ValueEditorProps } from "react-querybuilder";

export const SpectrumValueEditor = ({ value, handleOnChange }: ValueEditorProps) => {
    return (
      <TextField
        aria-label="Value"
        value={value ?? ""}
        onChange={(val) => handleOnChange(val)}
        width="size-2000"
      />
    );
  }

