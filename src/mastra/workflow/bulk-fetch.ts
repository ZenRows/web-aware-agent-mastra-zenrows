import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { zenrowsFetchTool } from '../tools/zenrows-fetch';

const prepareUrlsStep = createStep({
  id: 'prepare-urls',

  inputSchema: z.object({
    urls: z.array(z.string().url()),
  }),

  outputSchema: z.array(
    z.object({
      url: z.string().url(),
    }),
  ),

  execute: async ({ inputData }) => {
    return inputData.urls.map(url => ({
      url,
    }));
  },
});

const fetchProductStep = createStep({
  id: 'fetch-product',

  inputSchema: z.object({
    url: z.string().url(),
  }),

  outputSchema: z.object({
    url: z.string(),
    content: z.record(z.string(), z.unknown()),
    statusCode: z.number(),
  }),

  execute: async ({ inputData }) => {
    // createTool types execute as optional, so narrow it before calling
    if (!zenrowsFetchTool.execute) {
      throw new Error('Zenrows tool does not have an execute function');
    }

    const result = await zenrowsFetchTool.execute(
      {
        url: inputData.url,
        extractJson: true,
      },
      {} as any,
    );

    if (!result || 'statusCode' in result === false) {
      throw new Error('Zenrows tool returned an unexpected result');
    }

    return {
      url: inputData.url,
      // the tool returns a union, this workflow always extracts
      content: result.content as Record<string, unknown>,
      statusCode: result.statusCode,
    };
  },
});

export const productResearchWorkflow = createWorkflow({
  id: 'product-research-workflow',

  inputSchema: z.object({
    urls: z.array(z.string().url()),
  }),

  outputSchema: z.array(
    z.object({
      url: z.string(),
      content: z.record(z.string(), z.unknown()),
      statusCode: z.number(),
    }),
  ),
})
  .then(prepareUrlsStep)
  // concurrency controls how many urls run at once
  .foreach(fetchProductStep, { concurrency: 5 })
  .commit();