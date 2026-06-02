import OpenAI from 'openai';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new OpenAI({
  apiKey: "9RHwcaOLWs773i7s8W1VIO6IrgIbsRuWP4Uh32Dx4lYCjPnleGlBJQQJ99BEACHYHv6XJ3w3AAABACOGgGw3",
  baseURL: "https://testingsl1.openai.azure.com/openai/deployments/gpt-4.1",
  defaultQuery: {
    "api-version": "2024-02-15-preview",
  },
  defaultHeaders: {
    "api-key": "9RHwcaOLWs773i7s8W1VIO6IrgIbsRuWP4Uh32Dx4lYCjPnleGlBJQQJ99BEACHYHv6XJ3w3AAABACOGgGw3",
  },
});

type AIResponse = {
  locator: string;
  confidence: number;
  reason: string;
};


export async function getAILocator(data: any): Promise<AIResponse> {

  const prompt = `
You are a Playwright locator expert.

Goal:
Generate a UNIQUE, STABLE, and RELIABLE locator for the target element.

========================
CONTEXT
========================

Element Name:
${data.elementName}

Failed Locator:
${data.failedLocator}

Previous Smart Locators:
${JSON.stringify(data.smartLocators)}

Element Metadata:
${JSON.stringify(data.meta)}

------------------------
OLD ELEMENT SNAPSHOT
------------------------
${data.oldOuterHTML}

------------------------
OLD PAGE DOM
------------------------
${data.oldDOM}

------------------------
CURRENT PAGE DOM
------------------------
${data.newDOM}

------------------------
VISUAL CONTEXT
------------------------

OLD ELEMENT SCREENSHOT (base64):
${data.oldElementScreenshot || 'Not available'}

OLD FULL PAGE SCREENSHOT (base64):
${data.oldPageScreenshot || 'Not available'}

CURRENT FULL PAGE SCREENSHOT (base64):
${data.currentPageScreenshot || 'Not available'}

========================
INSTRUCTIONS
========================

Step 1:
Locate the element in the OLD PAGE DOM using the OLD ELEMENT SNAPSHOT.

Step 2:
Use OLD ELEMENT SCREENSHOT to understand exact visual identity.

Step 3:
Use OLD FULL PAGE SCREENSHOT to understand layout and position.

Step 4:
Compare with CURRENT FULL PAGE SCREENSHOT and CURRENT DOM.

Step 5:
Find the MOST SIMILAR element in CURRENT PAGE DOM.

Step 6:
Identify changes:
- id
- class
- text
- structure
- position

Step 7:
Generate the BEST locator.

========================
RULES (STRICT)
========================

- Locator MUST match EXACTLY ONE element
- Prefer in order:
  1. getByRole(role, { name })
  2. getByLabel()
  3. getByPlaceholder()
  4. getByText() (exact match)
- Use CSS selector if needed
- Avoid XPath unless absolutely necessary
- Avoid dynamic attributes
- Use exact matching wherever possible

========================
OUTPUT FORMAT (STRICT JSON ONLY)
========================

{
  "locator": "...",
  "confidence": 0-1,
  "reason": "Why this locator uniquely identifies the element based on OLD vs NEW comparison"
}
`;

  const response = await client.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT!,
    messages: [
      { role: 'system', content: 'You generate Playwright locators' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  });

  const text = response.choices[0].message.content || '';

  const cleaned = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {

    return JSON.parse(cleaned);
  } catch {
    throw new Error('Invalid AI response');
  }
}