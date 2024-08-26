import "@mantine/core/styles.css";
import { Flex, MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import React from "react";
import { AgenticTable } from "./components/AgenticTable";

export default function App() {
  return <MantineProvider theme={theme}>

    <Flex m='5%'>
      <AgenticTable />
    </Flex>
    
  </MantineProvider>;
}
