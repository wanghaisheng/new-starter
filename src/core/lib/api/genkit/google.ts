import { genkit } from 'genkit';
import { vertexAI, Imagen3 } from '@genkit-ai/vertexai';

const ai = genkit({ plugins: [vertexAI()] });

const response = await ai.generate({
  model: imagen3,
  output: { format: 'media' },
  prompt: 'a banana riding a bicycle',
});
return response.media();



import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';

const ai = genkit({ plugins: [googleAI()] });

const { text } = await ai.generate({
    model: gemini20Flash,
    prompt: 'Why is Firebase awesome?'
});


import { genkit } from 'genkit';
import { openAI, gpt4o } from 'genkitx-openai';

const ai = genkit({ plugins: [openAI()] });

const { text } = await ai.generate({
    model: gpt4o,
    prompt: 'Why is Firebase awesome?'
});


import { genkit } from 'genkit';
import { anthropic, claude35Sonnet } from 'genkitx-anthropic';

const ai = genkit({ plugins: [anthropic()] });

const { text } = await ai.generate({
    model: claude35Sonnet,
    prompt: 'Why is Firebase awesome?'
});



https://firebase.google.com/docs/genkit/plugins/vertex-ai?hl=zh-cn&authuser=0


https://github.com/firebase/genkit

