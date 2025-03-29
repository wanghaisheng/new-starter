
安装

npm i --save @genkit-ai/vertexai
如果您想在本地运行使用此插件的流程，还需要安装 Google Cloud CLI 工具。

配置
如需使用此插件，请在初始化 Genkit 时指定它：


import { genkit } from 'genkit';
import { vertexAI } from '@genkit-ai/vertexai';

const ai = genkit({
  plugins: [
    vertexAI({ location: 'us-central1' }),
  ],
});
该插件要求您指定 Google Cloud 项目 ID、要向其发出 Vertex API 请求的区域，以及 Google Cloud 项目凭据。

您可以通过在 vertexAI() 配置中设置 projectId 或设置 GCLOUD_PROJECT 环境变量来指定 Google Cloud 项目 ID。如果您要从 Google Cloud 环境（Cloud Functions、Cloud Run 等）运行 flow，系统会自动将 GCLOUD_PROJECT 设置为该环境的项目 ID。
您可以通过在 vertexAI() 配置中设置 location 或设置 GCLOUD_LOCATION 环境变量来指定 API 位置。
如需提供 API 凭据，您需要设置 Google Cloud 应用默认凭据。

如需指定凭据，请按照以下所述操作：

如果您要从 Google Cloud 环境（Cloud Functions、Cloud Run 等）运行 flow，系统会自动设置。
在本地开发环境中，通过运行以下命令执行此操作：


gcloud auth application-default login
对于其他环境，请参阅应用默认凭据文档。

此外，请确保为该账号授予 Vertex AI User IAM 角色 (roles/aiplatform.user)。请参阅 Vertex AI 访问权限控制文档。

用法
生成式 AI 模型
此插件会静态导出对其支持的生成式 AI 模型的引用：


import { gemini15Flash, gemini15Pro, imagen3 } from '@genkit-ai/vertexai';
您可以使用这些引用来指定 ai.generate() 使用的模型：


const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

const llmResponse = await ai.generate({
  model: gemini15Flash,
  prompt: 'What should I do when I visit Melbourne?',
});
此插件还支持使用 Google 搜索或您自己的数据为 Gemini 文本回答进行接地。

重要提示： 除了发出 LLM 请求的费用外，Vertex AI 还会针对着陆请求收取费用。请参阅 Vertex AI 价格页面，并确保您了解基准请求的价格，然后再使用此功能。
示例：


const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

await ai.generate({
  model: gemini15Flash,
  prompt: '...',
  config: {
    googleSearchRetrieval: {
      disableAttribution: true,
    }
    vertexRetrieval: {
      datastore: {
        projectId: 'your-cloud-project',
        location: 'us-central1',
        collection: 'your-collection',
      },
      disableAttribution: true,
    }
  }
})
此插件还会静态导出对 Gecko 文本嵌入模型的引用：


import { textEmbedding004 } from '@genkit-ai/vertexai';
您可以使用此引用指定索引编制工具或检索工具使用的嵌入程序。例如，如果您使用 Chroma DB，请执行以下操作：


const ai = genkit({
  plugins: [
    chroma([
      {
        embedder: textEmbedding004,
        collectionName: 'my-collection',
      },
    ]),
  ],
});
或者，您也可以直接生成嵌入：


const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

const embeddings = await ai.embed({
  embedder: textEmbedding004,
  content: 'How many widgets do you have in stock?',
});
此插件还可以处理多模态嵌入：


import { multimodalEmbedding001, vertexAI } from '@genkit-ai/vertexai';

const ai = genkit({
  plugins: [vertextAI({location: 'us-central1' })],
});

const embeddings = await ai.embed({
  embedder: multimodalEmbedding001,
  content: {
    content: [{
      "media": {
        "url": "gs://cloud-samples-data/generative-ai/video/pixel8.mp4",
        "contentType": "video/mp4"
      }
    }]
  }
});
Imagen3 模型支持根据用户提示生成图片：


import { imagen3 } from '@genkit-ai/vertexai';

const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

const response = await ai.generate({
  model: imagen3,
  output: { format: 'media' },
  prompt: 'a banana riding a bicycle',
});

return response.media();
甚至可以对现有图片进行高级编辑：


const ai = genkit({
  plugins: [vertexAI({ location: 'us-central1' })],
});

const baseImg = fs.readFileSync('base.png', { encoding: 'base64' });
const maskImg = fs.readFileSync('mask.png', { encoding: 'base64' });

const response = await ai.generate({
  model: imagen3,
  output: { format: 'media' },
  prompt: [
    { media: { url: `data:image/png;base64,${baseImg}` }},
    {
      media: { url: `data:image/png;base64,${maskImg}` },
      metadata: { type: 'mask' },
    },
    { text: 'replace the background with foo bar baz' },
  ],
  config: {
    editConfig: {
      editMode: 'outpainting',
    },
  },
});

return response.media();
如需了解更详细的选项，请参阅 Imagen 模型文档。

Vertex AI Model Garden 上的 Anthropic Claude 3
如果您有权使用 Vertex AI Model Garden 中的 Claude 3 模型（俳句、颂诗或颂歌），则可以将其与 Genkit 搭配使用。

以下是用于启用 Vertex AI Model Garden 模型的配置示例：


import { genkit } from 'genkit';
import {
  claude3Haiku,
  claude3Sonnet,
  claude3Opus,
  vertexAIModelGarden,
} from '@genkit-ai/vertexai/modelgarden';

const ai = genkit({
  plugins: [
    vertexAIModelGarden({
      location: 'us-central1',
      models: [claude3Haiku, claude3Sonnet, claude3Opus],
    }),
  ],
});
然后将其用作常规模型：


const llmResponse = await ai.generate({
  model: claude3Sonnet,
  prompt: 'What should I do when I visit Melbourne?',
});
Vertex AI Model Garden 中的 Llama 3.1 405b
首先，您需要在 Vertex AI Model Garden 中启用 Llama 3.1 API 服务。

以下是 Vertex AI 插件中 Llama 3.1 405b 的配置示例：


import { genkit } from 'genkit';
import { llama31, vertexAIModelGarden } from '@genkit-ai/vertexai/modelgarden';

const ai = genkit({
  plugins: [
    vertexAIModelGarden({
      location: 'us-central1',
      models: [llama31],
    }),
  ],
});
然后将其用作常规模型：


const llmResponse = await ai.generate({
  model: llama31,
  prompt: 'Write a function that adds two numbers together',
});
Vertex AI Model Garden 中的 Mistral 模型
如果您有权访问 Vertex AI Model Garden 中的 Mistral 模型（Mistral Large、Mistral Nemo 或 Codestral），则可以将它们与 Genkit 搭配使用。

以下是用于启用 Vertex AI Model Garden 模型的配置示例：


import { genkit } from 'genkit';
import {
  mistralLarge,
  mistralNemo,
  codestral,
  vertexAIModelGarden,
} from '@genkit-ai/vertexai/modelgarden';

const ai = genkit({
  plugins: [
    vertexAIModelGarden({
      location: 'us-central1',
      models: [mistralLarge, mistralNemo, codestral],
    }),
  ],
});
然后将其用作常规模型：


const llmResponse = await ai.generate({
  model: mistralLarge,
  prompt: 'Write a function that adds two numbers together',
  config: {
    version: 'mistral-large-2411', // Optional: specify model version
    temperature: 0.7,              // Optional: control randomness (0-1)
    maxOutputTokens: 1024,         // Optional: limit response length
    topP: 0.9,                     // Optional: nucleus sampling parameter
    stopSequences: ['###'],        // Optional: stop generation at sequences
  }
});
这些模型支持： - mistralLarge：具有函数调用功能的最新 Mistral 大型模型 - mistralNemo：针对效率和速度进行了优化 - codestral：专门用于代码生成任务

每个模型都支持流式响应和函数调用：


const response = await ai.generateStream({
  model: mistralLarge,
  prompt: 'What should I cook tonight?',
  tools: ['recipe-finder'],
  config: {
    version: 'mistral-large-2411',
    temperature: 1,
  },
});

for await (const chunk of response.stream) {
  console.log(chunk.text);
}
评估程序
如需使用 Vertex AI 快速评估中的评估器，请将 evaluation 块添加到 vertexAI 插件配置中。


import { genkit } from 'genkit';
import {
  vertexAIEvaluation,
  VertexAIEvaluationMetricType,
} from '@genkit-ai/vertexai/evaluation';

const ai = genkit({
  plugins: [
    vertexAIEvaluation({
      location: 'us-central1',
      metrics: [
        VertexAIEvaluationMetricType.SAFETY,
        {
          type: VertexAIEvaluationMetricType.ROUGE,
          metricSpec: {
            rougeType: 'rougeLsum',
          },
        },
      ],
    }),
  ],
});
上述配置为 Safety 和 ROUGE 指标添加了评估器。该示例展示了两种方法：Safety 指标使用默认规范，而 ROUGE 指标提供自定义规范，将 rouge 类型设置为 rougeLsum。

您可以使用 genkit eval:run 命令搭配兼容的数据集（即包含 output 和 reference 字段的数据集）运行这两种评估器。Safety 评估器还可以使用 genkit eval:flow -e vertexai/safety 命令运行，因为它只需要 output。

索引器和检索器
Genkit Vertex AI 插件包含由 Vertex AI Vector Search 服务支持的索引器和检索器实现。

（如需了解如何在 RAG 实现中使用索引器和检索器，请参阅检索增强生成页面。）

Vertex AI Vector Search 服务是一个文档索引，可与您选择的文档存储区搭配使用：文档存储区包含文档内容，而 Vertex AI Vector Search 索引则包含每个文档的向量嵌入以及对文档存储区中文档的引用。在 Vertex AI Vector Search 服务为您的文档编入索引后，它便可以响应搜索查询，并在文档存储区中生成索引列表。

Vertex AI 插件提供的索引编制器和检索器实现会使用 Cloud Firestore 或 BigQuery 作为文档存储区。该插件还包含您可以实现的接口，以支持其他文档存储区。

重要提示： 向量搜索的价格包括您提取的每 GB 数据的费用，以及托管已部署索引的虚拟机的按小时费用。请参阅 Vertex AI 价格。如果您要处理大量流量，这种方式可能是最经济实惠的。在使用该服务之前，请务必了解该服务对您的项目的结算影响。
如需使用 Vertex AI Vector Search，请执行以下操作：

选择嵌入模型。此模型负责根据文本或媒体内容创建向量嵌入。高级用户可以使用针对其特定数据集进行了优化的嵌入模型，但对于大多数用户来说，Vertex AI 的 text-embedding-004 模型适合处理英语文本，text-multilingual-embedding-002 模型适合处理多语言文本，multimodalEmbedding001 模型适合处理混合文本、图片和视频。
在 Google Cloud 控制台中的 Vector Search 部分，创建一个新索引。最重要的设置包括：

维度：指定所选嵌入模型生成的矢量的维度。text-embedding-004 和 text-multilingual-embedding-002 模型会生成 768 维的向量。multimodalEmbedding001 模型可以为文本和图片生成 128、256、512 或 1408 维的向量，并为视频生成 1408 维的向量。
更新方法：选择流式更新。
创建索引后，将其部署到标准（公共）端点。

获取要使用的文档存储空间的文档索引器和检索器：

Cloud Firestore


import { getFirestoreDocumentIndexer, getFirestoreDocumentRetriever } from '@genkit-ai/vertexai/vectorsearch';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

const firestoreDocumentRetriever = getFirestoreDocumentRetriever(db, FIRESTORE_COLLECTION);
const firestoreDocumentIndexer = getFirestoreDocumentIndexer(db, FIRESTORE_COLLECTION);
BigQuery


import { getBigQueryDocumentIndexer, getBigQueryDocumentRetriever } from '@genkit-ai/vertexai/vectorsearch';
import { BigQuery } from '@google-cloud/bigquery';

const bq = new BigQuery({ projectId: PROJECT_ID });

const bigQueryDocumentRetriever = getBigQueryDocumentRetriever(bq, BIGQUERY_TABLE, BIGQUERY_DATASET);
const bigQueryDocumentIndexer = getBigQueryDocumentIndexer(bq, BIGQUERY_TABLE, BIGQUERY_DATASET);
其他

如需支持其他文档存储区，您可以提供自己的 DocumentRetriever 和 DocumentIndexer 实现：


const myDocumentRetriever = async (neighbors) => {
  // Return the documents referenced by `neighbors`.
  // ...
}
const myDocumentIndexer = async (documents) => {
  // Add `documents` to storage.
  // ...
}
如需查看示例，请参阅包含本地文件的 Vertex AI 插件 Retriever 和 Indexer 示例。

将 vectorSearchOptions 块添加到 vertexAI 插件配置中：


import { genkit } from 'genkit';
import { textEmbedding004 } from '@genkit-ai/vertexai';
import { vertexAIVectorSearch } from '@genkit-ai/vertexai/vectorsearch';

const ai = genkit({
  plugins: [
    vertexAIVectorSearch({
      projectId: PROJECT_ID,
      location: LOCATION,
      vectorSearchOptions: [
        {
          indexId: VECTOR_SEARCH_INDEX_ID,
          indexEndpointId: VECTOR_SEARCH_INDEX_ENDPOINT_ID,
          deployedIndexId: VECTOR_SEARCH_DEPLOYED_INDEX_ID,
          publicDomainName: VECTOR_SEARCH_PUBLIC_DOMAIN_NAME,
          documentRetriever: firestoreDocumentRetriever,
          documentIndexer: firestoreDocumentIndexer,
          embedder: textEmbedding004,
        },
      ],
    }),
  ],
});
提供您在第一步中选择的嵌入程序，以及您在上一步中创建的文档索引编制程序和检索程序。

若要将该插件配置为使用您之前创建的 Vector Search 索引，您需要提供多个值，这些值可在 Google Cloud 控制台中的“Vector Search”部分找到：

indexId：列在索引标签页中
indexEndpointId：列在索引端点标签页上
deployedIndexId 和 publicDomainName：列在“已部署的索引信息”页面上，您可以通过点击上述任一标签页中的已部署索引的名称来打开该页面
现在，所有配置都已完成，您可以在 Genkit 应用中使用索引编制器和检索器：


import {
  vertexAiIndexerRef,
  vertexAiRetrieverRef,
} from '@genkit-ai/vertexai/vectorsearch';

// ... inside your flow function:

await ai.index({
  indexer: vertexAiIndexerRef({
    indexId: VECTOR_SEARCH_INDEX_ID,
  }),
  documents,
});

const res = await ai.retrieve({
  retriever: vertexAiRetrieverRef({
    indexId: VECTOR_SEARCH_INDEX_ID,
  }),
  query: queryDocument,
});
请参阅以下代码示例：

Vertex Vector Search + BigQuery
Vertex Vector Search + Firestore
Vertex Vector Search + 自定义数据库
上下文缓存
Vertex AI Genkit 插件支持上下文缓存，这让模型能够重复使用之前缓存的内容，以便在处理大量内容时优化令牌用量。此功能特别适用于对话流程，或者模型在多次请求中一致引用大量内容的场景。

如何使用上下文缓存
如需启用上下文缓存，请确保您的模型支持该功能。例如，gemini15Flash 和 gemini15Pro 是支持上下文缓存的模型，您必须指定版本号 001。

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
  prompt: 'Describe Pierre’s transformation throughout the novel.',
});
在此设置中： - messages：允许您传递对话记录。 - metadata.cache.ttlSeconds：指定缓存特定响应的存留时间 (TTL)。

示例：利用包含上下文的大文本
对于引用长篇文档（例如《战争与和平》或《指环王》）的应用，您可以构建查询以重复使用缓存的上下文：



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
  prompt: 'Analyze the relationship between Pierre and Natasha.',
});
上下文缓存的优势
提升性能：减少对大型输入重复处理的需要。
费用效率：减少对冗余数据的 API 使用，优化令牌消耗。
延迟时间更短：缩短重复或相关查询的响应时间。
支持上下文缓存的模型
只有特定模型（例如 gemini15Flash 和 gemini15Pro）支持上下文缓存，并且目前仅适用于版本号 001。如果使用了不受支持的模型，系统会引发错误，指明无法应用缓存。

其他阅读材料
如需详细了解 Vertex AI 中的上下文缓存，请参阅其文档。

该内容对您有帮助吗？

发送反馈
如未另行说明，那么本页面中的内容已根据知识共享署名 4.0 许可获得了许可，并且代码示例已根据 Apache 2.0 许可获得了许可。有关详情，请参阅 Google 开发者网站政策。Java 是 Oracle 和/或其关联公司的注册商标。

最后更新时间 (UTC)：2025-02-06。

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
新页面已加载。.