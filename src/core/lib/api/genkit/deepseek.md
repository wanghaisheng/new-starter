https://www.npmjs.com/package/genkitx-deepseek

skip to:contentpackage searchsign in
❤
Pro
Teams
Pricing
Documentation
npm
Search packages
Search
genkitx-deepseek
TypeScript icon, indicating that this package has built-in type declarations
1.0.1 • Public • Published 2 months ago
Firebase Genkit + DeepSeek

Firebase Genkit DeepSeek Plugin
License: Apache 2.0 NPM version

DeepSeek is a community plugin for using DeepSeek APIs with Firebase Genkit. This plugin provides a simple interface to DeepSeek’s chat and reasoning models through the Genkit plugin system.

Note: This plugin is based on the OpenAI plugin code from The Fire Company and is distributed under the Apache 2.0 License.

Supported Models
DeepSeek Chat – The primary chat model for conversation.
DeepSeek Reasoner – The reasoning model for analytical responses.
Installation
Install the plugin in your project with your favorite package manager:

npm install genkitx-deepseek
# or
yarn add genkitx-deepseek
# or
pnpm add genkitx-deepseek
Usage
Initialization
import { genkit } from 'genkit';
import deepseek, { deepseekChat } from 'genkitx-deepseek';

const ai = genkit({
  plugins: [deepseek({ apiKey: process.env.DEEPSEEK_API_KEY })],
  // Optionally specify a default model if not provided in generate params:
  model: deepseekChat,
});
Basic Example
const response = await ai.generate({
  model: deepseekChat,
  prompt: 'Tell me a joke!',
});

console.log(response.text);
License
This project is licensed under the Apache 2.0 License.

Readme
Keywords
genkitgenkit-plugingenkit-embeddergenkit-modeldeepseekpluginopenaiaigenaigenerative-ai
Package Sidebar
Install
npm i genkitx-deepseek

Repository
github.com/oddbit/genkitx-deepseek

Homepage
github.com/oddbit/genkitx-deepseek#readme

Weekly Downloads
20

Version
1.0.1

License
Apache-2.0

Unpacked Size
126 kB

Total Files
19

Issues
0

Pull Requests
0

Last publish
2 months ago

Collaborators
dennis-alund
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
