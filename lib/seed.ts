import { query } from './db';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import "dotenv/config"

function parseDate(dateString: string): string {
  if (!dateString) {
    throw new Error('Empty date string');
  }
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    // Ensure year is 4 digits
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month}-${day}`;
  }
  console.warn(`Could not parse date: ${dateString}`);
  throw Error();
}

export async function seed() {
  const createTable = await query(`
    CREATE TABLE IF NOT EXISTS unicorns (
      id SERIAL PRIMARY KEY,
      company VARCHAR(255) NOT NULL UNIQUE,
      valuation DECIMAL(10, 2) NOT NULL,
      date_joined DATE,
      country VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      select_investors TEXT NOT NULL
    );
  `);

  console.log(`Created "unicorns" table`);

  const results: any[] = [];
  const csvFilePath = path.join(process.cwd(), 'unicorns.csv');

  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => {
        // Only add rows that have all required fields
        if (data.Company && data['Date Joined'] && data.Country && data.City && data.Industry && data['Select Investors']) {
          results.push(data);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  for (const row of results) {
    try {
      const formattedDate = parseDate(row['Date Joined']);

      await query(
        `INSERT INTO unicorns (company, valuation, date_joined, country, city, industry, select_investors)
        VALUES ($1, $2, $3::DATE, $4, $5, $6, $7)
        ON CONFLICT (company) DO NOTHING;`,
        [
          row.Company,
          parseFloat(row['Valuation ($B)'].replace('$', '').replace(',', '')),
          formattedDate,
          row.Country,
          row.City,
          row.Industry,
          row['Select Investors']
        ]
      );
    } catch (error) {
      console.warn(`Skipping row for company ${row.Company} due to error:`, error);
    }
  }

  console.log(`Seeded ${results.length} unicorns`);

  return {
    createTable,
    unicorns: results,
  };
}

seed().catch(console.error);