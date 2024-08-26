import { ActionIcon, CloseIcon, Flex, TextInput, Table, Button } from "@mantine/core";
// import { IconSquareRoundedMinus } from "@mantine/icons";
import React, { useEffect, useState, memo } from "react";


/**
 * Represents an AgenticTable component.
 * This component displays a table which allows for user-defined columns and user-defined rows.
 * 
 * Agents will be spun up in each cell which will "run" a query using the column and row values.
 */
export const AgenticTable = () => {

  const [columns, setColumns] = useState<string[]>(["company_ceo", "company_founded", "company_industry", "company_size", "company_is_public", "company_series"]);
  const [newColumn, setNewColumn] = useState<string>("");

  const [targets, setTargets] = useState<string[]>(["LangChain"]);
  const [newTarget, setNewTarget] = useState<string>("");

  const [targetData, setTargetData] = useState<{ target: string, enrichment_fields: { [key: string]: string | undefined } }[]>([
    {
      "target": "LangChain",
      "enrichment_fields": {
        "company_ceo": "Harrison Chase",
        "company_founded": "2019",
        "company_industry": "Technology",
        "company_size": "30",
        "company_is_public": "False",
        "company_series": "A"
      }
    },
  ]);


  const triggerGetEnrichment = async () => {
    console.log("Triggering get enrichment", targetData);

    // Get the cells which need to be updated.
    // Defined as cells which have data with value undefined.
    // cellsToUpdate = [ {"target": "LangChain", "enrichment_field": "company_ceo"}, ...]
    const cellsToUpdate = targetData.reduce((acc: { target: string, enrichment_field: string }[], curr) => {
      const cellKeys = Object.keys(curr.enrichment_fields);
      cellKeys.forEach((key) => {
        if (curr.enrichment_fields[key] === undefined) {
          acc.push({ target: curr.target, enrichment_field: key });
        }
      });

      return acc;
    }, []);

    // For each cell, run the query and update the data.
    // Performend asynchronously and in parallel.
    const promises = cellsToUpdate.map(async (cell: { target: string, enrichment_field: string }) => {
      // Run the query
      // const response = await fetch("https://api.langchain.com/v2/query", {
      //   method: "POST",
      //   body: JSON.stringify(cell),
      //   headers: {
      //     "Content-Type": "application/json"
      //   }
      // });

      // Mocked query: Will return "testing" after a random delay between 1 and 5 seconds
      const response: Promise<{ json: () => Promise<{ target: string, enrichment_field: string, data: string }> }> = new Promise((resolve) => {
        setTimeout(() => {
          resolve({ json: () => Promise.resolve({ target: cell.target, enrichment_field: cell.enrichment_field, data: "Test" }) });
        }, Math.random() * 4000 + 1000);
      });

      response.then(async (response) => {
        // Grab the data from the response
        const data = await response.json();
        console.log("Data", data);

        // Update the targetData
        setTargetData(targetData.map((element) => {
          if (element.target === cell.target) {
            element.enrichment_fields[cell.enrichment_field] = data.data;
          }
          return element;
        }));
      });

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
        <Button onClick={() => {
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
        <Button onClick={() => {
          setTargets([...targets, newTarget]);
          setTargetData([...targetData, {
            target: newTarget,
            enrichment_fields: columns.reduce((acc, curr) => {
              acc[curr] = undefined;
              return acc;
            }, {})
          }]);
          setNewTarget("");
        }}>
          Add Target
        </Button>
      </Flex>
      <Table
        stickyHeader
        withColumnBorders
        withRowBorders
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Target</Table.Th>
            {
              columns.map((column) => (
                <Table.Th key={column}>
                  {column}
                  {/* <ActionIcon>
                    <IconSquareRoundedMinus />
                  </ActionIcon> */}
                </Table.Th>
              ))
            }
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {
            targets.map((target) => (
              <Table.Tr key={target}>
                <Table.Td>{target}</Table.Td>
                {
                  columns.map((column) => (
                    <AgenticTableCell
                      key={column}
                      target={target}
                      column={column}
                      data={targetData.find((element) => element.target === target)?.enrichment_fields[column] || ""}
                    />
                  ))
                }
              </Table.Tr>
            ))
          }
        </Table.Tbody>
      </Table>
    </Flex>
  );
}


type AgenticTableCellProps = {
  target: string,
  column: string,
  data: string,
}

/**
 * Represents an AgenticTableCell component.
 * 
 * This component represents a single cell in the AgenticTable and will be responsible for running the query.
 * 
 */
const AgenticTableCell = memo(function AgenticTableCell({
  target,
  column,
  data,
}: AgenticTableCellProps) {

  return (
    <Table.Td key={`${target}-${column}`}>
      {data}
    </Table.Td>
  );
})


const input_v2 = {
  "target": "LangChain",
  "enrichment_field": "ceo"
}

const output_v2 = {
  "target": "LangChain",
  "data": {
    "ceo": "Harrison Chase"
  }
}