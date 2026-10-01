# Build a Web-Aware TypeScript Agent With Mastra and Zenrows

A Mastra market research agent that reads live product data from dynamic and protected sites through a custom Zenrows Fetch tool. The tool returns Markdown for the agent to reason over, or structured JSON when the task needs fields rather than prose.

## Features

- Custom Zenrows Fetch tool built with Mastra's `createTool` and Zod schemas
- `mode=auto` on every request, so each target gets the access configuration it needs
- Markdown output for agent reasoning, structured JSON output through Extract
- Market research agent with an explicit system prompt for reliable tool calling
- Deterministic workflow that processes a known URL list with configurable concurrency
- Typed input and output validation on every tool and workflow step
- Works with OpenAI and Anthropic models through a one-line change

## Prerequisites

- Node.js 22.13 or later, matching the `engines` field in `package.json`
- A Zenrows API key. [Create a free account](https://app.zenrows.com/register)
- An API key for one model provider, OpenAI or Anthropic. You only need the one you plan to use

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/ZenRows/web-aware-agent-mastra-zenrows.git
cd web-aware-agent-mastra-zenrows
```

### 2. Install dependencies

```bash
npm install
```

## Configuration

Copy the example environment file and add your keys:

```bash
cp .env.example .env
```

```
ZENROWS_API_KEY=your_zenrows_api_key
OPENAI_API_KEY=your_openai_api_key
```

Mastra loads `.env` automatically. The standalone test scripts load it through `dotenv/config`. `.env` is excluded from version control.

## Project structure

```
.
├── src/
│   └── mastra/
│       ├── agents/
│       │   ├── agent.ts                     # the scaffolded starter agent
│       │   └── market-research-agent.ts     # the agent this project builds
│       ├── tools/
│       │   ├── zenrows-fetch.ts             # the Zenrows Fetch tool
│       │   ├── schedule-tools.ts            # scaffolded, registered in index.ts
│       │   ├── test-tool.ts                 # Markdown path, no agent
│       │   ├── test-tool-extend-extract.ts  # structured path, no agent
│       │   └── test-agent.ts                # the agent end to end
│       ├── workflow/
│       │   ├── bulk-fetch.ts                # deterministic multi-URL workflow
│       │   └── test-workflow.ts             # runs the workflow
│       └── index.ts                         # registers agents, tools and workflows
├── .env.example
├── package.json
├── tsconfig.json
├── LICENSE
└── README.md
```

The three files the article builds are `zenrows-fetch.ts`, `market-research-agent.ts` and `bulk-fetch.ts`. `agent.ts` and `schedule-tools.ts` come from the Mastra scaffold and are kept because `index.ts` registers them.

## How it works

The tool wraps the Zenrows Fetch API and returns either Markdown or parsed JSON depending on the `extractJson` flag. The agent reads the tool description and decides which it needs. The workflow skips the model entirely and always extracts.

```
URL
  ↓
zenrows-fetch tool (mode=auto)
  ↓
Markdown  or  extract=auto JSON
  ↓
agent reasoning  or  workflow array output
```

## Running the project

### Test the tool directly

Markdown output:

```bash
npx tsx src/mastra/tools/test-tool.ts
```

Structured JSON output:

```bash
npx tsx src/mastra/tools/test-tool-extend-extract.ts
```

### Run the agent

```bash
npx tsx src/mastra/tools/test-agent.ts
```

### Run the bulk workflow

```bash
npx tsx src/mastra/workflow/test-workflow.ts
```

### Run Mastra Studio

```bash
npm run dev
```

Studio serves at `http://localhost:4111` and gives you a chat UI against the registered agents.

## Output

The tool test prints a status code and the page as Markdown, or a parsed product object when `extractJson` is true.

The agent test prints the tool call it made, including the arguments it chose, followed by a comparison table built from the fetched data.

The workflow test prints an array of results in the same order as the input URLs, each with the source URL, the parsed content, and a status code.

Field names in extracted output vary by page type. Search pages and browse pages on the same site can return different keys, so check what your target actually returns before depending on a specific field.

## Technologies

- TypeScript
- Mastra
- Zenrows Fetch
- Zod
- OpenAI

## Troubleshooting

**`Expected 2 arguments, but got 1`.** `createTool` types `execute` as taking the input and a second runtime-context argument, and types it as optional. Narrow it with `if (!tool.execute)` first, then call it with both arguments, as `bulk-fetch.ts` does. Calling it with the input alone does not compile.

**`401` from Zenrows.** `ZENROWS_API_KEY` is missing from `.env`. The tool sends the value as-is, so an unset variable reaches the API as an invalid key.

**`429` during workflow runs.** Lower the `concurrency` value on the `.foreach` call to stay within your plan's limit. For large lists, [Zenrows Batch](https://www.zenrows.com/products/batch) runs the whole list as one managed job instead.

**`getWorkflow` returns undefined.** The workflow is not registered in `src/mastra/index.ts`, or the key does not match the name passed to `getWorkflow`.

**Markdown output looks like navigation.** The test script slices the first 300 characters, which on a large retailer page is the header. Slice further in, or use the structured path.

## Maintenance

Dependencies and the Zenrows API surface are re-verified each quarter. File issues on this repository.

## Related article

This repository accompanies the Zenrows article:

**[Build a Web-Aware TypeScript Agent With Mastra and Zenrows](https://www.zenrows.com/blog/web-aware-typescript-agent-mastra-zenrows)**
