"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import { query } from "@/lib/db";
import { z } from "zod";
import { searchEntity } from "@/lib/entity-search";
import { anthropic } from "@/lib/anthropic";

interface SearchEntityInput {
  description: string;
}

interface QueryResponse {
  query: string;
  reasoning: string[];
}

export async function generateQuery(question: string): Promise<QueryResponse> {
  const reasoning: string[] = [];
  let finalQuery = '';

  try {
    const stream = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      stream: true,
      tools: [{
        name: "searchEntity",
        description: "Search for a database table based on a description",
        input_schema: {
          type: "object",
          properties: {
            description: {
              type: "string",
              description: "Description of the table you're looking for"
            }
          },
          required: ["description"]
        }
      }],
      messages: [
        {
          role: "user",
          content: `You are a SQL expert. You have access to a tool called 'searchEntity' that can help you find the right table to query. The tool takes a description and returns a table name and confidence score.

Question: ${question}

Instructions:
- First, decide if you need to use the searchEntity tool to find the right table
- If you do, use the tool and wait for the response
- Then generate a SQL query using the table name
- Use ILIKE for string fields
- Return quantitative data suitable for charting
- Use proper SQL syntax
- When you provide the SQL query, wrap it in a \`\`\`sql code block
- The table has the following columns:
  - company: string
  - valuation: number
  - date_joined: date
  - country: string
  - city: string
  - industry: string
  - select_investors: string

Please explain your reasoning as you go. Start with "Let me think about this..." and explain your thought process.`
        }
      ]
    });

    // Process the stream
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text;
        // Extract SQL query from code block if present
        const sqlBlockMatch = text.match(/```sql\n([\s\S]*?)```/);
        if (sqlBlockMatch) {
          finalQuery = sqlBlockMatch[1].trim();
        } else {
          // Add non-SQL text to reasoning
          reasoning.push(text);
        }
      } else if (chunk.type === 'message_delta' && (chunk.delta as any).tool_use) {
        const toolUse = (chunk.delta as any).tool_use;
        if (toolUse.name === 'searchEntity') {
          const input = toolUse.input as SearchEntityInput;
          reasoning.push(`I'll use the searchEntity tool to find the right table. Looking for: ${input.description}`);
          
          const entityResult = await searchEntity(input.description);
          reasoning.push(`Found table: ${entityResult.tableName} (confidence: ${entityResult.confidence})`);
          
          // Send the table name back to Claude
          const secondStream = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 1000,
            stream: true,
            messages: [
              {
                role: "user",
                content: `You are a SQL expert. Generate a SQL query based on the following question. The query should be compatible with PostgreSQL and use the ${entityResult.tableName} table.

Question: ${question}

Instructions:
- Use ILIKE for string fields
- Return quantitative data suitable for charting
- Use proper SQL syntax
- When you provide the SQL query, wrap it in a \`\`\`sql code block
- The table has the following columns:
  - company: string
  - valuation: number
  - date_joined: date
  - country: string
  - city: string
  - industry: string
  - select_investors: string

Please explain your reasoning as you go. Start with "Now I'll generate the SQL query..." and explain your thought process.`
              }
            ]
          });

          // Process the second stream
          for await (const secondChunk of secondStream) {
            if (secondChunk.type === 'content_block_delta' && secondChunk.delta.type === 'text_delta') {
              const text = secondChunk.delta.text;
              // Extract SQL query from code block if present
              const sqlBlockMatch = text.match(/```sql\n([\s\S]*?)```/);
              if (sqlBlockMatch) {
                finalQuery = sqlBlockMatch[1].trim();
                console.log('Found SQL query in second stream:', finalQuery);
              } else if (!text.includes('```')) {
                // Only add non-SQL text to reasoning if it's not part of a code block
                reasoning.push(text);
              }
            }
          }
        }
      }
    }

    // Filter out empty lines from reasoning
    const filteredReasoning = reasoning.filter(line => line.trim().length > 0);

    console.log('Final query:', finalQuery);
    console.log('Reasoning steps:', filteredReasoning);

    return {
      query: finalQuery,
      reasoning: filteredReasoning
    };
  } catch (error: any) {
    console.error("Error generating query:", error);
    return {
      query: '',
      reasoning: [...reasoning, `Error: ${error?.message || 'Unknown error occurred'}`]
    };
  }
}

export async function runGenerateSQLQuery(sqlQuery: string) {
  try {
    if (!sqlQuery.toLowerCase().startsWith("select") && !sqlQuery.toLowerCase().startsWith("with")) {
      throw new Error("Only SELECT queries are allowed");
    }
    const results = await query(sqlQuery);
    // Convert the results to a plain object
    return {
      rows: results.rows.map(row => ({ ...row })),
      rowCount: results.rowCount,
      fields: results.fields.map(field => ({
        name: field.name,
        dataTypeID: field.dataTypeID
      }))
    };
  } catch (error: any) {
    console.error("Error running query:", error);
    throw new Error(error?.message || 'Failed to execute query');
  }
}

export async function explainQuery(question: string, sqlQuery: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a SQL expert. Explain the following SQL query in a user-friendly way. Break it down into sections.

Question: ${question}

SQL Query: ${sqlQuery}

Instructions:
- Break down the query into logical sections
- Explain each section in simple terms
- Focus on how the query answers the user's question
- Return a JSON array of objects with "section" and "explanation" fields
- Only return the JSON without any additional text`,
        },
      ],
    });

    if (response.content[0].type === 'text') {
      const explanations = JSON.parse(response.content[0].text.trim());
      return { explanations };
    }
    return { explanations: [] };
  } catch (error: any) {
    console.error("Error explaining query:", error);
    return { explanations: [] };
  }
}

export async function generateChartConfig(results: Result[], question: string) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `You are a data visualization expert. Generate a chart configuration based on the following data and question. The configuration should be in JSON format.

Question: ${question}

Data: ${JSON.stringify(results)}

Instructions:
- Return a JSON object with the following structure:
{
  "type": "line" | "bar" | "pie" | "scatter",
  "xAxis": {
    "dataKey": string,
    "label": string
  },
  "yAxis": {
    "dataKey": string,
    "label": string
  },
  "title": string
}
- Choose the most appropriate chart type based on the data and question
- Use meaningful labels for axes
- Only return the JSON configuration without any additional text`,
        },
      ],
    });

    if (response.content[0].type === 'text') {
      const config = JSON.parse(response.content[0].text.trim());
      return { config };
    }
    return { config: {} };
  } catch (error: any) {
    console.error("Error generating chart config:", error);
    return { config: {} };
  }
}
