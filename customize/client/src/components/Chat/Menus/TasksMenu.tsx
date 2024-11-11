import { Content, Portal, Root } from '@radix-ui/react-popover';
import type { FC } from 'react';
import TitleButton from './UI/TitleButton';
import { useRecoilState } from 'recoil';
import { useChatContext } from '~/Providers';
import store from '~/store';

const TaskMessages = [
  { main: "Text Summarization", sub: "e.g. 'Can you summarize this financial report?' (User provides text of the report.)", prompt: "Perform Text Summarization Task:" },
  { main: "Sentiment Analysis", sub: "e.g. 'What is the sentiment in this paragraph of earnings call transcript?' (User provides the transcript.)", prompt: "Perform Sentiment Analysis Task:" },
  { main: "Risk Analysis", sub: "e.g. Analyze the risks associated with this investment portfolio.' (User provides portfolio details.)", prompt: "Perform Risk Analysis Task:" },
  { main: "Financial Document Processing (e.g., claim processing)", sub: "e.g. 'Given the following claim report, identify and list the key pieces of information crucial for processing the insurance claim.' (User provides claim report text.)", prompt: "Perform Financial Document Processing Task:" },
  { main: "Entity Recognition", sub: "e.g. 'Identify key entities in this news article.' (User provides text from the annual report.)", prompt: "Perform Entity Recognition Task:" },
  { main: "Business Event Detection", sub: "e.g. 'Detect any major events in this news article.' (User provides the article text.)", prompt: "Perform Business Event Detection Task:" },
  { main: "ESG Analysis", sub: "e.g. 'Provide an ESG analysis based on this report.' (User provides the ESG report.)", prompt: "Perform ESG Risk Analysis:" },
  { main: "Question Answering (based on provided text, including text-form tables)", sub: "e.g. : 'Compare the revenue growth of Company A and Company B based on this financial report.' (User provides the financial report text including tables.)", prompt: "Perform Question Answering Task:" }
];

const TasksMenu: FC = () => {
  const { newConversation, index } = useChatContext();
  const [activePrompt, setActivePrompt] = useRecoilState(store.activePromptByIndex(index));

  const handleTaskClick = async (prompt: string) => {
    try {
      await newConversation();
      setActivePrompt(prompt);
    } catch (error) {
      console.error('Error handling task click:', error);
    }
  };

  return (
    <Root>
      <TitleButton primaryText="Tasks" />
      <Portal>
        <div
          style={{
            position: 'fixed',
            left: '0px',
            top: '0px',
            transform: 'translate3d(268px, 50px, 0px)',
            minWidth: 'max-content',
            zIndex: 'auto',
          }}
        >
          <Content
            side="bottom"
            align="start"
            className="mt-2 max-h-[65vh] w-[280px] overflow-y-auto rounded-lg border border-border-light bg-header-primary text-text-primary shadow-lg lg:max-h-[75vh]"
          >
            <div className="p-2">
              {TaskMessages.map((task, index) => (
                <button
                  key={index}
                  className="w-full rounded-lg p-3 text-left hover:bg-hover-light dark:hover:bg-hover-dark"
                  onClick={() => handleTaskClick(task.prompt)}
                >
                  <div className="font-semibold text-sm">{task.main}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {task.sub}
                  </div>
                </button>
              ))}
            </div>
          </Content>
        </div>
      </Portal>
    </Root>
  );
};

export default TasksMenu;