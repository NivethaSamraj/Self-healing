import { pool } from './db';

export async function saveHealingLog(data: any) {
  const query = `
    INSERT INTO healing_logs
    (element_name, test_name, failed_locator, attempted_locators, healed_locator, strategy, status, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

  await pool.query(query, [
    data.elementName,
    data.testName,
    data.failedLocator,
    JSON.stringify(data.attemptedLocators),
    data.healedLocator,
    data.strategy,
    data.status,
    data.errorMessage,
  ]);
}