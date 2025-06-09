"use server";

import { Config, configSchema, explanationsSchema, Result } from "@/lib/types";
import Anthropic from '@anthropic-ai/sdk';
import { query } from "@/lib/db";
import { generateObject } from "ai";
import { z } from "zod";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const generateQuery = async (input: string) => {
  "use server";
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      system: `You are a SQL (postgres) and data visualization expert. Your job is to help the user write a SQL query to retrieve the data they need. The table schema is as follows:

      unicorns (
      id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL UNIQUE,
      valuation DECIMAL(10, 2) NOT NULL,
      date_joined DATE,
      country VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      select_investors TEXT NOT NULL
    );

    Only retrieval queries are allowed.

    For things like industry, company names and other string fields, use the ILIKE operator and convert both the search term and the field to lowercase using LOWER() function. For example: LOWER(industry) ILIKE LOWER('%search_term%').

    Note: select_investors is a comma-separated list of investors. Trim whitespace to ensure you're grouping properly. Note, some fields may be null or have only one value.
    When answering questions about a specific field, ensure you are selecting the identifying column (ie. what is Vercel's valuation would select company and valuation').

    The industries available are:
    - healthcare & life sciences
    - consumer & retail
    - financial services
    - enterprise tech
    - insurance
    - media & entertainment
    - industrials
    - health

    If the user asks for a category that is not in the list, infer based on the list above.

    Note: valuation is in billions of dollars so 10b would be 10.0.
    Note: if the user asks for a rate, return it as a decimal. For example, 0.1 would be 10%.

    If the user asks for 'over time' data, return by year.

    When searching for UK or USA, write out United Kingdom or United States respectively.

    EVERY QUERY SHOULD RETURN QUANTITATIVE DATA THAT CAN BE PLOTTED ON A CHART! There should always be at least two columns. If the user asks for a single column, return the column and the count of the column. If the user asks for a rate, return the rate as a decimal. For example, 0.1 would be 10%.

    Return ONLY the SQL query, nothing else.`,
      messages: [
        {
          role: "user",
          content: `Generate the query necessary to retrieve the data the user wants: ${input}`
        }
      ]
    });

    const query = message.content[0].type === 'text' ? message.content[0].text.trim() : '';
    return query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const runGenerateSQLQuery = async (sqlQuery: string) => {
  "use server";
  // Check if the query is a SELECT statement
  if (
    !sqlQuery.trim().toLowerCase().startsWith("select") ||
    sqlQuery.trim().toLowerCase().includes("drop") ||
    sqlQuery.trim().toLowerCase().includes("delete") ||
    sqlQuery.trim().toLowerCase().includes("insert") ||
    sqlQuery.trim().toLowerCase().includes("update") ||
    sqlQuery.trim().toLowerCase().includes("alter") ||
    sqlQuery.trim().toLowerCase().includes("truncate") ||
    sqlQuery.trim().toLowerCase().includes("create") ||
    sqlQuery.trim().toLowerCase().includes("grant") ||
    sqlQuery.trim().toLowerCase().includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  let data: any;
  try {
    data = await query(sqlQuery);
  } catch (e: any) {
    if (e.message.includes('relation "unicorns" does not exist')) {
      console.log(
        "Table does not exist, creating and seeding it with dummy data now...",
      );
      // throw error
      throw Error("Table does not exist");
    } else {
      throw e;
    }
  }

  return data.rows as Result[];
};

export const explainQuery = async (input: string, sqlQuery: string) => {
  "use server";
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      system: `You are a SQL (postgres) expert. Your job is to explain to the user write a SQL query you wrote to retrieve the data they asked for. The table schema is as follows:
    unicorns (
      id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL UNIQUE,
      valuation DECIMAL(10, 2) NOT NULL,
      date_joined DATE,
      country VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      select_investors TEXT NOT NULL
    );

    When you explain you must take a section of the query, and then explain it. Each "section" should be unique. So in a query like: "SELECT * FROM unicorns limit 20", the sections could be "SELECT *", "FROM UNICORNS", "LIMIT 20".
    If a section doesnt have any explanation, include it, but leave the explanation empty.

    Return the response in JSON format with an array of objects containing "section" and "explanation" fields.`,
      messages: [
        {
          role: "user",
          content: `Explain the SQL query you generated to retrieve the data the user wanted. Assume the user is not an expert in SQL. Break down the query into steps. Be concise.

          User Query:
          ${input}

          Generated SQL Query:
          ${sqlQuery}`
        }
      ]
    });

    const response = message.content[0].type === 'text' ? JSON.parse(message.content[0].text) : [];
    return { explanations: response };
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};

export const generateChartConfig = async (
  results: Result[],
  userQuery: string,
) => {
  "use server";
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      system: `You are a data visualization expert. Return the response in JSON format matching the following schema:
      {
        "description": "string",
        "takeaway": "string",
        "type": "bar" | "line" | "area" | "pie",
        "title": "string",
        "xKey": "string",
        "yKeys": string[],
        "multipleLines": boolean,
        "measurementColumn": string,
        "lineCategories": string[],
        "legend": boolean
      }`,
      messages: [
        {
          role: "user",
          content: `Given the following data from a SQL query result, generate the chart config that best visualises the data and answers the users query.
          For multiple groups use multi-lines.

          User Query:
          ${userQuery}

          Data:
          ${JSON.stringify(results, null, 2)}`
        }
      ]
    });

    const config = message.content[0].type === 'text' ? JSON.parse(message.content[0].text) : {};
    const colors: Record<string, string> = {};
    config.yKeys.forEach((key: string, index: number) => {
      colors[key] = `hsl(var(--chart-${index + 1}))`;
    });

    const updatedConfig: Config = { ...config, colors };
    return { config: updatedConfig };
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate chart suggestion");
  }
};
