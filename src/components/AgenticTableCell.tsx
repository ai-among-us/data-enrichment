import { ActionIcon, Flex, Loader, Table, TextInput } from "@mantine/core";
import { IconCheck, IconFileX, IconX } from "@tabler/icons-react";
import { memo, useState } from "react";
import { AGENT_FAILED, AGENT_LOADING } from "../constants/AgentTableConstants";

/**
 * Represents an AgenticTableCellProps interface.
 */
type AgenticTableCellProps = {
  target: string,
  column: string,
  value: string | undefined | typeof AGENT_LOADING | typeof AGENT_FAILED,
  setValue: (value: string) => void
}

/**
 * Represents an AgenticTableCell component.
 * 
 * This component represents a single cell in the AgenticTable and will be responsible for running the query.
 * 
 */
export const AgenticTableCell = memo(function AgenticTableCell({
  target,
  column,
  value,
  setValue
}: AgenticTableCellProps) {

  const [editing, setEditing] = useState<boolean>(false);
  const [cellValue, setCellValue] = useState<string>(value as string);

  return (
    <Table.Td key={`${target}-${column}`}>
      {
        value == AGENT_FAILED &&
        <Flex align='center' justify='center'>
          <IconFileX color='red' />
        </Flex>
      }
      {value == AGENT_LOADING &&
        <Flex align='center' justify='center'>
          <Loader size='xs' />
        </Flex>
      }
      {value !== AGENT_FAILED && value !== AGENT_LOADING && !editing &&
        <Flex align='center' justify='center' onClick={() => setEditing(true)}>
          {value}
        </Flex>
      }
      {
        editing &&
        <Flex align='center' justify='center'>
          <TextInput
            value={cellValue}
            onChange={(e) => {
              // Update the targetData
              setCellValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setValue(cellValue);
                setEditing(false);
              } else if (e.key === "Escape") {
                setCellValue(value as string);
                setEditing(false);
              }
            }}
            onBlur={() => {
              setValue(value as string);
              setEditing(false);
            }}
            rightSection={
              <Flex mr='md'>
                <ActionIcon
                  variant={"transparent"}
                  size='xs'
                  onClick={() => {
                    setCellValue(value as string);
                    setEditing(false);
                  }}>
                  <IconX />
                </ActionIcon>
                <ActionIcon
                  variant={"transparent"}
                  size='xs'
                  onClick={() => {
                    setValue(cellValue);
                    setEditing(false);
                  }}>
                  <IconCheck />
                </ActionIcon>
              </Flex>
            }
          />
        </Flex>
      }

    </Table.Td>
  );
});