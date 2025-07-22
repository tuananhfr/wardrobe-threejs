import React from "react";
import { useConfig } from "../context/WardrobeContext";

const ConfigPanel: React.FC = () => {
  const { config, updateConfig, batchUpdate } = useConfig();

  return <></>;
};

export default ConfigPanel;
