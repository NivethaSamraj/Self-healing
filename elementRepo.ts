import { pool } from './db';

export async function saveElement(data: any) {
  const query = `
    INSERT INTO elements 
    (element_name, page_url, primary_locator, smart_locators, meta, outer_html, context_dom, element_screenshot, full_page_screenshot)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (element_name)
    DO UPDATE SET
      page_url = EXCLUDED.page_url,
      primary_locator = EXCLUDED.primary_locator,
      smart_locators = EXCLUDED.smart_locators,
      meta = EXCLUDED.meta,
      outer_html = COALESCE(NULLIF(EXCLUDED.outer_html, ''), elements.outer_html),
      context_dom = COALESCE(NULLIF(EXCLUDED.context_dom, ''), elements.context_dom),
      element_screenshot = COALESCE(EXCLUDED.element_screenshot, elements.element_screenshot),
      full_page_screenshot = COALESCE(EXCLUDED.full_page_screenshot, elements.full_page_screenshot),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;

  const result = await pool.query(query, [
    data.elementName,
    data.pageUrl,
    data.primaryLocator,
    JSON.stringify(data.smartLocators ?? {}),
    JSON.stringify(data.meta ?? {}),
    data.outerHTML ?? null,
    data.context_dom ?? null,
    data.elementScreenshot ?? null,    
    data.fullPageScreenshot ?? null,    
  ]);

  console.log("SAVED ELEMENT:", {
    name: result.rows[0]?.element_name,
    hasOuterHTML: !!result.rows[0]?.outer_html,
    hasScreenshot: !!result.rows[0]?.element_screenshot,
  });

  return result.rows[0];
}

export async function getElement(elementName: string) {
  const query = `SELECT * FROM elements WHERE element_name = $1`;
  const result = await pool.query(query, [elementName]);
  return result.rows[0] || null;
}