skip to:contentpackage searchsign in
❤
Pro
Teams
Pricing
Documentation
npm
Search packages
Search
genkitx-huggingface
TypeScript icon, indicating that this package has built-in type declarations
1.0.0 • Public • Published a month ago
Firebase Genkit + Hugging Face Models

Firebase Genkit <> Hugging Face Models Plugin
Hugging Face Models Community Plugin for Google Firebase Genkit
GitHub version NPM Downloads GitHub License Static Badge
GitHub Issues or Pull Requests GitHub Issues or Pull Requests GitHub commit activity
genkitx-huggingface is a community plugin for using Hugging Face Models APIs with Firebase Genkit. Built by Xavier Portilla Edo.

This Genkit plugin allows to use Hugging Face models through their official APIs.

Installation
Install the plugin in your project with your favorite package manager:

npm install genkitx-huggingface
pnpm add genkitx-huggingface
Usage
Configuration
To use the plugin, you need to configure it with your Hugging Face Token key. You can do this by calling the genkit function:

import { genkit, z } from 'genkit';
import { huggingface, openAIGpt4o } from "genkitx-huggingface";

const ai = genkit({
  plugins: [
    huggingface({
      huggingfaceToken: '<my-huggingface-token>',
    }),
    openAIGpt4o,
  ]
});
You can also initialize the plugin in this way if you have set the HUGGINGFACE_TOKEN environment variable:

import { genkit, z } from 'genkit';
import { huggingface, openAIGpt4o } from "genkitx-huggingface";

const ai = genkit({
  plugins: [
    huggingface({
      huggingfaceToken: '<my-huggingface-token>',
    }),
    openAIGpt4o,
  ]
});
Basic examples
The simplest way to call the text generation model is by using the helper function generate:

import { genkit, z } from 'genkit';
import { huggingface, openAIGpt4o } from "genkitx-huggingface";

// Basic usage of an LLM
const response = await ai.generate({
  prompt: 'Tell me a joke.',
});

console.log(await response.text);
Within a flow
// ...configure Genkit (as shown above)...

export const myFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (subject) => {
    const llmResponse = await ai.generate({
      prompt: `Suggest an item for the menu of a ${subject} themed restaurant`,
    });

    return llmResponse.text;
  }
);
Tool use
// ...configure Genkit (as shown above)...

const specialToolInputSchema = z.object({ meal: z.enum(["breakfast", "lunch", "dinner"]) });
const specialTool = ai.defineTool(
  {
    name: "specialTool",
    description: "Retrieves today's special for the given meal",
    inputSchema: specialToolInputSchema,
    outputSchema: z.string(),
  },
  async ({ meal }): Promise<string> => {
    // Retrieve up-to-date information and return it. Here, we just return a
    // fixed value.
    return "Baked beans on toast";
  }
);

const result = ai.generate({
  tools: [specialTool],
  prompt: "What's for breakfast?",
});

console.log(result.then((res) => res.text));
For more detailed examples and the explanation of other functionalities, refer to the official Genkit documentation.

Supported models
This plugin supports all currently available Chat/Completion and Embeddings models from Hugging Face Models. This plugin supports image input and multimodal models.

API Reference
This plugin supports all Hugging Face models available in the Inference Providers on the Hub.

Contributing
Want to contribute to the project? That's awesome! Head over to our Contribution Guidelines.

Need support?
[!NOTE]
This repository depends on Google's Firebase Genkit. For issues and questions related to Genkit, please refer to instructions available in Genkit's repository.

Reach out by opening a discussion on GitHub Discussions.

Credits
This plugin is proudly maintained by Xavier Portilla Edo Xavier Portilla Edo.

I got the inspiration, structure and patterns to create this plugin from the Genkit Community Plugins repository built by the Fire Compnay as well as the ollama plugin.

License
This project is licensed under the Apache 2.0 License.

License: Apache 2.0

Readme
Keywords
genkitgenkit-plugingenkit-modelhuggingfacehuggingface-modelsaigenaigenerative-ai
Provenance
Built and signed on
GitHub Actions
View build summary
Source Commit

github.com/xavidop/genkitx-huggingface@3a8e5ab
Build File

.github/workflows/release.yml
Public Ledger

Transparency log entry
Share feedback
Package Sidebar
Install
npm i genkitx-huggingface

Repository
github.com/xavidop/genkitx-huggingface

Homepage
github.com/xavidop/genkitx-huggingface#readme

Weekly Downloads
0

Version
1.0.0


License
Apache-2.0

Unpacked Size
206 kB

Total Files
18

Issues
0

Pull Requests
0

Last publish
a month ago

Collaborators
xavidop
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
