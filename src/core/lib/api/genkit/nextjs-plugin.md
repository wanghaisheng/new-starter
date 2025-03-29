
Genkit Next.js Plugin
This plugin provides utilities for conveninetly exposing Genkit flows and actions via Next.js app routs for REST APIs.

// /genkit/simpleFlow.ts
const simpleFlow = ai.defineFlow(
  'simpleFlow',
  async (input, streamingCallback) => {
    const { text } = await ai.generate({
      model: gemini15Flash,
      prompt: input,
      streamingCallback: (chunk) => streamingCallback(chunk.text),
    });
    return text;
  }
);
// /app/api/simpleFlow/route.ts
import { simpleFlow } from '@/genkit/simpleFlow';
import { appRoute } from '@genkit-ai/nextjs';

export const POST = appRoute(simpleFlow);
APIs can be called with the generic genkit/beta/client library, or @genkit-ai/nextjs/client

import { runFlow, streamFlow } from '@genkit-ai/nextjs/client';
import { simpleFlow } from '@/genkit/simpleFlow';

const result = await runFlow<typeof simpleFlow>({
  url: '/api/simpleFlow',
  input: 'say hello',
});

console.log(result); // hello

// set auth headers (when using auth policies)
const result = await runFlow<typeof simpleFlow>({
  url: `/api/simpleFlow`,
  headers: {
    Authorization: 'open sesame',
  },
  input: 'say hello',
});

console.log(result); // hello

// and streamed
const result = streamFlow<typeof simpleFlow>({
  url: '/api/simpleFlow',
  input: 'say hello',
});
for await (const chunk of result.stream()) {
  console.log(chunk.output);
}
console.log(await result.output());
The sources for this package are in the main Genkit repo. Please file issues and pull requests against that repo.

Usage information and reference details can be found in Genkit documentation.

License: Apache 2.0

Readme
Keywords
genkitgenkit-plugingoogle cloudgoogle aiaigenaigenerative-ainextnextjsnext.jsreact
Package Sidebar
Install
npm i @genkit-ai/next

Repository
github.com/firebase/genkit

Homepage
github.com/firebase/genkit#readme

Weekly Downloads
798

Version
1.4.0

License
Apache-2.0

Unpacked Size
53.4 kB

Total Files
21

Issues
373

Pull Requests
82

Last publish
3 days ago

Collaborators
pavelgj
i2amsam
apascal07
google-wombot
Try on RunKit
Report malware
Footer
Support
Help
Advisories
Status
Contact npm
Company
About
Blog
Press
Terms & Policies
Policies
Terms of Use
Code of Conduct
Privacy
