import { GoogleGenerativeAI } from '@google/generative-ai'
import {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} from '@google/generative-ai/server'
import path from 'path'

const arxivId = '2408.14527'

const fileManager = new GoogleAIFileManager(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY,
)

const filepath = path.join(process.cwd(), 'data', `${arxivId}.pdf`)

const uploadResponse = await fileManager.uploadFile(filepath, {
  mimeType: 'application/pdf',
  displayName: arxivId,
})

console.log('PDF uploaded')

const ai = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
const model = ai.getGenerativeModel({
  model: 'models/gemini-1.5-pro',
  systemInstruction: `You are an expert in computer science research with a specialization in translating complex academic concepts for software engineers focused on web development. Your role involves:

1. Thoroughly analyzing and comprehending computer science research papers, particularly those relevant to web technologies and practices.

2. Distilling complex academic concepts into clear, practical explanations tailored for web developers.

3. Bridging the gap between theoretical research and practical application in web development contexts.

4. Using familiar web development terminology, frameworks, and real-world scenarios to illustrate research concepts.

5. Highlighting the potential impact and applications of research findings on current and future web development practices.

6. Anticipating and addressing common questions or misconceptions that web developers might have about the research.

7. Providing concise summaries that capture the essence of the research while emphasizing its relevance to web development.

8. When appropriate, suggesting how the research findings could be implemented or experimented with using common web technologies.

Your explanations should be clear, engaging, and directly applicable to the daily work of software engineers in web development. Aim to inspire curiosity and demonstrate the practical value of the research in advancing web technologies and methodologies.`,
})

const result = await model.generateContent({
  contents: [
    {
      role: 'user',
      parts: [
        {
          fileData: {
            mimeType: uploadResponse.file.mimeType,
            fileUri: uploadResponse.file.uri,
          },
        },
        {
          //   text: 'Please summarize the paper.',
          // text: 'If a software engineer reads this, how could they use this knowledge in their work? Use practical examples to demonstrate.',
          text: 'Does this paper feature a "pseudocode block" that explains an algorithm? If yes, please convert it to JavaScript, and briefly explain the algorithm and what is it used for. If there are multiple, please convert all of them. If none of them, just say "No pseudocode block found".',
        },
      ],
    },
  ],
})

console.log(result.response.usageMetadata)

// The output should look something like this:
//
// {
//   promptTokenCount: 696220,
//   candidatesTokenCount: 270,
//   totalTokenCount: 696490,
//   cachedContentTokenCount: 696191
// }

console.log('Summary:')
console.log(result.response.text())