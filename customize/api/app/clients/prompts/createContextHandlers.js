const axios = require('axios');
const { isEnabled } = require('~/server/utils');
const { logger } = require('~/config');

const footer = `Use the context as your learned knowledge to better answer the user.

In your response, remember to follow these guidelines:
- If you don't know the answer, simply state that the context does not provide the relevant information, and then ask for the necessary details.
- If you are unsure how to answer, ask for clarification.
- Avoid mentioning that you obtained the information from the context.
- Only focus on the latest context.
`;

function createContextHandlers(req, userMessageContent) {
  if (!process.env.RAG_API_URL) {
    return;
  }

  const queryPromises = [];
  const processedFiles = [];
  const processedIds = new Set();
  const jwtToken = req.headers.authorization.split(' ')[1];
  const useFullContext = isEnabled(process.env.RAG_USE_FULL_CONTEXT);

  const query = async (file) => {
    if (useFullContext) {
      return axios.get(`${process.env.RAG_API_URL}/documents/${file.file_id}/context`, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
    }

    return axios.post(
      `${process.env.RAG_API_URL}/query`,
      {
        file_id: file.file_id,
        query: userMessageContent,
        k: 4,
      },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  };

  // const processFile = async (file) => {
  //   if (file.embedded && !processedIds.has(file.file_id)) {
  //     try {
  //       const promise = query(file);
  //       queryPromises.push(promise);
  //       processedFiles.push(file);
  //       processedIds.add(file.file_id);
  //     } catch (error) {
  //       logger.error(`Error processing file ${file.filename}:`, error);
  //     }
  //   }
  // };

  const processFile = async (file) => {
    if (file.embedded && !processedIds.has(file.file_id)) {
      try {
        if (processedIds.size > 0) {
          console.error(Array.from(processedIds))
          logger.info(`Received multiple files, retaining only the latest one.`);
          processedIds.clear();
          queryPromises.length = 0;
        }

        logger.info(`Processing file: ${file.filename}`);
        console.log(file)
        const promise = query(file);
        queryPromises.push(promise);
        processedFiles.push(file);
        processedIds.add(file.file_id);
      } catch (error) {
        logger.error(`Error processing file ${file.filename}:`, error);
      }
    }
  };
  const createContext = async () => {
    try {
      if (!queryPromises.length || !processedFiles.length) {
        return '';
      }

      const oneFile = processedFiles.length === 1;
      const header = `Please read and complete the user instructions based on the following ${oneFile ? 'a' : processedFiles.length} file${
        !oneFile ? 's' : ''
      }:`;

      const files = `${
        oneFile
          ? ''
          : ``
      }${processedFiles
        .map(
          (file) => `---
            File Name: ${file.filename}
            File Type: ${file.type}
            ---
            `,
        )
        .join('')}${
        oneFile
          ? ''
          : ``
      }`;

      const resolvedQueries = await Promise.all(queryPromises);

      const context =
        resolvedQueries.length === 0
          ? '\n\tThe semantic search did not return any results.'
          : resolvedQueries
            .map((queryResult, index) => {
              const file = processedFiles[index];
              let contextItems = queryResult.data;

              const generateContext = (currentContext) =>
              `---
              File Name: ${file.filename}
              File Context: ${currentContext}
              `;

              if (useFullContext) {
                return generateContext(`\n${contextItems}`);
              }

              contextItems = queryResult.data
                .map((item) => {
                  const pageContent = item[0].page_content;
                  return `
                  ${pageContent?.trim()}
                  `
                })
                .join('');

              return generateContext(contextItems);
            })
            .join('');

      if (useFullContext) {
        const prompt = `${header}
          ${context}
          ${footer}`;

        return prompt;
      }

      const prompt = `${header}
        ${files}

        A semantic search was executed with the user's message as the query, retrieving the following context inside <context></context> XML tags.

        <context>${context}
        </context>

        ${footer}`;

      return prompt;
    } catch (error) {
      logger.error('Error creating context:', error);
      throw error;
    }
  };

  return {
    processFile,
    createContext,
  };
}

module.exports = createContextHandlers;
