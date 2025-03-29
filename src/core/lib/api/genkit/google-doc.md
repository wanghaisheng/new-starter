
Google 生成式 AI 插件通过 Gemini API 提供 Google 的 Gemini 模型的接口。

安装

npm i --save @genkit-ai/googleai
配置
如需使用此插件，请在初始化 Genkit 时指定该插件：


import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});
该插件需要使用 Gemini API 的 API 密钥，您可以从 Google AI Studio 获取该密钥。

通过执行以下一项操作，将插件配置为使用 API 密钥：

将 GEMINI_API_KEY 环境变量设置为 API 密钥。
在初始化插件时指定 API 密钥：


googleAI({ apiKey: yourKey });
不过，请勿直接在代码中嵌入 API 密钥！仅将此功能与 Cloud Secret Manager 或类似服务结合使用。

用法
此插件会静态导出对其支持的模型的引用：


import {
  gemini15Flash,
  gemini15Pro,
  textEmbedding004,
} from '@genkit-ai/googleai';
您可以使用这些引用来指定 generate() 使用的模型：


const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

const llmResponse = await ai.generate('Tell me a joke.');
或使用嵌入程序（例如 textEmbedding004）与 embed 或检索器搭配使用：


const ai = genkit({
  plugins: [googleAI()],
});

const embeddings = await ai.embed({
  embedder: textEmbedding004,
  content: input,
});
Gemini Files API
您可以将上传到 Gemini Files API 的文件与 Genkit 搭配使用：


import { GoogleAIFileManager } from '@google/generative-ai/server';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const ai = genkit({
  plugins: [googleAI()],
});

const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);
const uploadResult = await fileManager.uploadFile(
  'path/to/file.jpg',
  {
    mimeType: 'image/jpeg',
    displayName: 'Your Image',
  }
);

const response = await ai.generate({
  model: gemini15Flash,
  prompt: [
    {text: 'Describe this image:'},
    {media: {contentType: uploadResult.file.mimeType, url: uploadResult.file.uri}}
  ]
});
经过微调的模型
您可以使用使用 Google Gemini API 微调的模型。按照 Gemini API 中的说明操作，或使用 AI Studio 微调模型。

调优过程会使用基本模型（例如 Gemini 1.5 Flash）和您提供的示例来创建新的调优模型。记下您使用的基准模型，然后复制新模型的 ID。

在 Genkit 中调用经过调优的模型时，请使用基础模型作为 model 参数，并将经过调优的模型的 ID 作为 config 块的一部分传递。例如，如果您使用 Gemini 1.5 Flash 作为基础模型，并获得了模型 ID tunedModels/my-example-model-apbm8oqbvuv2，则可以使用以下命令调用该模型：


const ai = genkit({
  plugins: [googleAI()],
});

const llmResponse = await ai.generate({
  prompt: `Suggest an item for the menu of fish themed restruant`,
  model: gemini15Flash.withConfig({
    version: "tunedModels/my-example-model-apbm8oqbvuv2",
  }),
});
上下文缓存
Google 生成式 AI 插件支持上下文缓存，可让模型重复使用之前缓存的内容，以优化性能并缩短重复性任务的延迟时间。此功能对于对话流程或模型在多个请求中一致引用大量文本的场景特别有用。

如何使用上下文缓存
如需启用上下文缓存，请确保您的模型支持该功能。例如，gemini15Flash 和 gemini15Pro 是支持上下文缓存的模型。

您可以在应用中定义缓存机制，如下所示：


const ai = genkit({
  plugins: [googleAI()],
});

const llmResponse = await ai.generate({
  messages: [
    {
      role: 'user',
      content: [{ text: 'Here is the relevant text from War and Peace.' }],
    },
    {
      role: 'model',
      content: [
        {
          text: 'Based on War and Peace, here is some analysis of Pierre Bezukhov’s character.',
        },
      ],
      metadata: {
        cache: {
          ttlSeconds: 300, // Cache this message for 5 minutes
        },
      },
    },
  ],
  model: gemini15Flash,
  config: {
    version: 'gemini-1.5-flash-001', // Only 001 currently supports context caching
  },
  prompt: 'Describe Pierre’s transformation throughout the novel.',
});
在此设置中： - messages：允许您传递对话记录。 - metadata.cache.ttlSeconds：指定缓存特定响应的存留时间 (TTL)。

示例：利用包含上下文的大文本
对于引用长篇文档（例如《战争与和平》或《指环王》）的应用，您可以构建查询以重复使用缓存的上下文：


const fs = require('fs/promises');

const textContent = await fs.readFile('path/to/war_and_peace.txt', 'utf-8');

const llmResponse = await ai.generate({
  messages: [
    {
      role: 'user',
      content: [{ text: textContent }], // Include the large text as context
    },
    {
      role: 'model',
      content: [
        {
          text: 'This analysis is based on the provided text from War and Peace.',
        },
      ],
      metadata: {
        cache: {
          ttlSeconds: 300, // Cache the response to avoid reloading the full text
        },
      },
    },
  ],
  model: gemini15Flash,
  config: {
    version: 'gemini-1.5-flash-001', // Only 001 currently supports context caching
  },
  prompt: 'Analyze the relationship between Pierre and Natasha.',
});
缓存其他内容模式
Gemini 模型是多模态的，并且允许缓存其他模式的内容。

例如，如需缓存一段较长的视频内容，您必须先使用 Google AI SDK 中的文件管理器进行上传：


import { GoogleAIFileManager } from '@google/generative-ai/server';


const fileManager = new GoogleAIFileManager(
  process.env.GEMINI_API_KEY
);

// Upload video to Google AI using the Gemini Files API
const uploadResult = await fileManager.uploadFile(videoFilePath, {
  mimeType: 'video/mp4', // Adjust according to the video format
  displayName: 'Uploaded Video for Analysis',
});

const fileUri = uploadResult.file.uri;

现在，您可以在调用 ai.generate 时配置缓存： ts const analyzeVideoResponse = await ai.generate({ messages: [ { role: 'user', content: [ { media: { url: fileUri, // Use the uploaded file URL contentType: 'video/mp4', }, }, ], }, { role: 'model', content: [ { text: 'This video seems to contain several key moments. I will analyze it now and prepare to answer your questions.', }, ], // Everything up to (including) this message will be cached. metadata: { cache: true, }, }, ], config: { version: 'gemini-1.5-flash-001', // Only 001 versions support context caches }, model: gemini15Flash, prompt: query, });

支持上下文缓存的模型
只有特定模型（例如 gemini15Flash 和 gemini15Pro）支持上下文缓存。如果使用了不受支持的模型，系统会引发错误，指明无法应用缓存。

其他阅读材料
如需详细了解 Google AI 中的上下文缓存，请参阅其文档。

该内容对您有帮助吗？

发送反馈
如未另行说明，那么本页面中的内容已根据知识共享署名 4.0 许可获得了许可，并且代码示例已根据 Apache 2.0 许可获得了许可。有关详情，请参阅 Google 开发者网站政策。Java 是 Oracle 和/或其关联公司的注册商标。

最后更新时间 (UTC)：2025-03-07。

学习
开发者指南
SDK 和 API 参考文档
示例
库
GitHub
掌握动态
查看博客
Find us on Reddit
在 X 上关注
Subscribe on YouTube
参加活动
支持
与支持团队联系
Stack Overflow
Slack 社区
Google group
版本说明
品牌指南
常见问题解答
Google Developers
Android
Chrome
Firebase
Google Cloud Platform
所有产品
条款
隐私权政策

中文 – 简体
新页面已加载。