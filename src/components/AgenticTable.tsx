import { Flex, TextInput, Text, Table, Button, ActionIcon } from "@mantine/core";
import { IconCheck, IconSquareRoundedMinus, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { AGENT_FAILED, AGENT_LOADING } from "../constants/AgentTableConstants";
import { AgenticTableCell } from "./AgenticTableCell";

// Load environment variables from .env file
const LANGCHAIN_API_KEY = import.meta.env.VITE_LANGCHAIN_API_KEY;


/**
 * Represents an AgenticTable component.
 * This component displays a table which allows for user-defined columns and user-defined rows.
 * 
 * Agents will be spun up in each cell which will "run" a query using the column and row values.
 */
export const AgenticTable = () => {

  const [columns, setColumns] = useState<string[]>(["company_ceo", "company_founded", "company_industry", "company_size", "company_series"]);
  const [newColumn, setNewColumn] = useState<string>("");

  const [targets, setTargets] = useState<string[]>(["LangChain"]);
  const [newTarget, setNewTarget] = useState<string>("");
  const [targetLabel, setTargetLabel] = useState<string>("Target");
  const [newTargetLabel, setNewTargetLabel] = useState<string>(targetLabel);
  const [editingTargetLabel, setEditingTargetLabel] = useState<boolean>(false);

  const [targetData, setTargetData] = useState<{ target: string, enrichment_fields: { [key: string]: string | undefined | typeof AGENT_LOADING | typeof AGENT_FAILED } }[]>([
    {
      "target": "LangChain",
      "enrichment_fields": {
        "company_ceo": "Harrison Chase",
        "company_founded": "2022",
        "company_industry": AGENT_FAILED,
        "company_size": "30",
        "company_series": "A"
      }
    },
  ]);


  const triggerGetEnrichment = async () => {
    // Step 1: Get the cells which need to be updated -- i.e. cells which have data with value undefined.
    // cellsToUpdate = [ {"target": "LangChain", "enrichment_field": "company_ceo"}, ...]
    const cellsToUpdate = targetData.reduce((acc: { target: string, enrichment_field: string }[], curr) => {
      const cellKeys = Object.keys(curr.enrichment_fields);
      cellKeys.forEach((key) => {
        if (curr.enrichment_fields[key] === undefined || curr.enrichment_fields[key] === AGENT_FAILED) {
          acc.push({ target: curr.target, enrichment_field: key });
        }
      });

      return acc;
    }, []);

    console.log("Cells to update", cellsToUpdate);

    // Step 2. For each cell, run the query and update the data.
    // Performend asynchronously and in parallel.
    cellsToUpdate.map(async (cell: { target: string, enrichment_field: string }) => {
      // 2.0.0 Set all fields to a "Loading" state using a Sentinel value
      setTargetData(targetData.map((element) => {
        if (element.target === cell.target) {
          element.enrichment_fields[cell.enrichment_field] = AGENT_LOADING;
        }
        return element;
      }));

      // 2.0.1 Get potential examples - i.e. data that exists in other columns, up to 5 examples
      const examples = targetData.reduce((acc: string[], curr) => {
        if (curr.target !== cell.target) {
          const example = curr.enrichment_fields[cell.enrichment_field];
          if (example !== undefined && example !== AGENT_LOADING && example !== AGENT_FAILED) {
            acc.push(example);
          }
        }
        return acc;
      }, []).slice(0, 5);

      // 2.1 Create a new Thread
      console.log("Creating a new thread");
      const threadResponse = await fetch("https://data-enrichment-da27f172bb7e522382156f9e02aef3e0.default.us.langgraph.app/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": LANGCHAIN_API_KEY,
        },
        body: JSON.stringify({
          "metadata": {}
        })
      });
      const threadData = await threadResponse.json();
      const threadID = threadData.thread_id;

      // 2.2 Create a Run
      console.log("Creating a new run");
      const runResponse = await fetch(`https://data-enrichment-da27f172bb7e522382156f9e02aef3e0.default.us.langgraph.app/threads/${threadID}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": LANGCHAIN_API_KEY,
        },
        body: JSON.stringify({
          "assistant_id": "agent",
          "input": {
            "input_info": {
              [targetLabel]: cell.target,
            },
            "target": cell.enrichment_field,
            "examples": examples
          }
        })
      });
      const runData = await runResponse.json();
      const runID = runData.run_id;

      // 2.3 Wait for the Run to finish
      console.log("Waiting for the run to finish");
      const joinResponse = await fetch(`https://data-enrichment-da27f172bb7e522382156f9e02aef3e0.default.us.langgraph.app/threads/${threadID}/runs/${runID}/join`, {
        method: "GET",
        headers: {
          "X-Api-Key": LANGCHAIN_API_KEY,
        }
      });
      const joinData = joinResponse.status;
      if (joinData > 299) {
        console.log("Error", joinData);
      }

      // 2.4 Get the result
      const stateResponse = await fetch(`https://data-enrichment-da27f172bb7e522382156f9e02aef3e0.default.us.langgraph.app/threads/${threadID}/state`, {
        method: "GET",
        headers: {
          "X-Api-Key": LANGCHAIN_API_KEY,
        }
      });
      const stateData = await stateResponse.json();
      let output = stateData.values.output;
      if (output === undefined) {
        output = "No data";
      }
      if (output.length > 30) {
        output = output.slice(0, 30) + "...";
      }

      // 2.5 Update the targetData
      setTargetData(targetData.map((element) => {
        if (element.target === cell.target) {
          element.enrichment_fields[cell.enrichment_field] = output;
        }
        return element;
      }));


      // Mocked query: Will return "testing" after a random delay between 1 and 5 seconds
      // const response: Promise<{ json: () => Promise<{ target: string, enrichment_field: string, data: string }> }> = new Promise((resolve) => {
      //   setTimeout(() => {
      //     resolve({ json: () => Promise.resolve({ target: cell.target, enrichment_field: cell.enrichment_field, data: "Test" }) });
      //   }, Math.random() * 4000 + 1000);
      // });

      // response.then(async (response) => {
      //   // Grab the data from the response
      //   const data = await response.json();
      //   console.log("Data", data);

      //   // Update the targetData
      //   setTargetData(targetData.map((element) => {
      //     if (element.target === cell.target) {
      //       element.enrichment_fields[cell.enrichment_field] = data.data;
      //     }
      //     return element;
      //   }));
      // });

    });
  }


  return (
    <Flex
      direction="column"
      gap="md"
      style={{ width: "100%" }}
    >
      <Button onClick={() => { triggerGetEnrichment() }}>
        Get Enrichment
      </Button>
      <Flex align={'flex-end'} justify={'space-between'}>
        <TextInput
          label="Add Column"
          placeholder="An enrichment field"
          miw='80%'
          value={newColumn}
          onChange={(e) => setNewColumn(e.target.value)}
        />
        <Button
          disabled={newColumn.length === 0}
          onClick={() => {
            setColumns([...columns, newColumn]);
            setTargetData(targetData.map((element) => {
              element.enrichment_fields[newColumn] = undefined;
              return element;
            }));
            setNewColumn("");
          }}>
          Add Column
        </Button>
      </Flex>
      <Flex align={'flex-end'} justify={'space-between'}>
        <TextInput
          label="Add Target"
          placeholder="A target entity"
          miw='80%'
          value={newTarget}
          onChange={(e) => setNewTarget(e.target.value)}
        />
        <Button
          disabled={newTarget.length === 0}
          onClick={() => {
            setTargets([...targets, newTarget]);
            setTargetData([...targetData, {
              target: newTarget,
              enrichment_fields: columns.reduce((acc: any, curr) => {
                acc[curr] = undefined;
                return acc;
              }, {})
            }]);
            setNewTarget("");
          }}>
          Add {targetLabel}
        </Button>
      </Flex>
      <Table
        stickyHeader
        withColumnBorders
        withRowBorders
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              {editingTargetLabel ? (
                <TextInput
                  value={newTargetLabel}
                  onChange={(e) => {
                    setNewTargetLabel(e.target.value);
                  }}
                  rightSection={
                    <Flex mr='md'>
                      <ActionIcon
                        variant={"transparent"}
                        size='xs'
                        onClick={() => {
                          setEditingTargetLabel(false);
                          setNewTargetLabel(targetLabel)
                        }}>
                        <IconX />
                      </ActionIcon>
                      <ActionIcon
                        variant={"transparent"}
                        size='xs'
                        onClick={() => {
                          setEditingTargetLabel(false);
                          setTargetLabel(newTargetLabel);
                        }}>
                        <IconCheck />
                      </ActionIcon>
                    </Flex>
                  }
                />
              ) : (
                <Flex onClick={() => setEditingTargetLabel(true)} align='center' justify='center'>
                  {targetLabel}
                </Flex>
              )}
            </Table.Th>
            {
              columns.map((column) => (
                <Table.Th key={column}>
                  <Flex justify='center' align='center'>
                    {column}
                    <ActionIcon
                      ml='4px'
                      variant={"transparent"}
                      size='xs'
                      onClick={() => {
                        setColumns(columns.filter((element) => element !== column));
                        setTargetData(targetData.map((element) => {
                          delete element.enrichment_fields[column];
                          return element;
                        }));
                      }}>
                      <IconSquareRoundedMinus />
                    </ActionIcon>
                  </Flex>
                </Table.Th>
              ))
            }
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {
            targets.map((target) => (
              <Table.Tr key={target}>
                <Table.Td>
                  <Flex align='center' justify='center'>
                    <Text fw={'bold'}>
                      {target}
                    </Text>
                    <ActionIcon
                      ml='4px'
                      variant={"transparent"}
                      size='xs'
                      onClick={() => {
                        setTargets(targets.filter((element) => element !== target));
                        setTargetData(targetData.filter((element) => element.target !== target));
                      }}>
                      <IconSquareRoundedMinus />
                    </ActionIcon>
                  </Flex>

                </Table.Td>
                {
                  columns.map((column) => (
                    <AgenticTableCell
                      key={column}
                      target={target}
                      column={column}
                      value={targetData.find((element) => element.target === target)?.enrichment_fields[column]}
                      setValue={(value) => {
                        setTargetData(targetData.map((element) => {
                          if (element.target === target) {
                            element.enrichment_fields[column] = value;
                          }
                          return element;
                        }));
                      }}
                    />
                  ))
                }
              </Table.Tr>
            ))
          }
        </Table.Tbody>
      </Table>
    </Flex >
  );
}

// Feed in examples
// Add multiple targets at once