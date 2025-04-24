import { genkit } from 'genkit';
import { vertexAI, imagen3 } from '@genkit-ai/vertexai';

const ai = genkit({ plugins: [vertexAI()] });

const { text } = await ai.generate({
    model: imagen3,
    prompt: 'Why is Firebase awesome?'
});

// 如需使用 anthropic/claude，可参考官方文档添加插件。
