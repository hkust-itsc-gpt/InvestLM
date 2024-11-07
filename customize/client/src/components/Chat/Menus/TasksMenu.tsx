import { Content, Portal, Root } from '@radix-ui/react-popover';
import type { FC } from 'react';
import TitleButton from './UI/TitleButton';
import { useRecoilState } from 'recoil';
import { useChatContext } from '~/Providers';
import store from '~/store';

const TaskMessages = [
  { main: "Report Summarization", sub: "e.g. Based on the Earnings call transcript, summarize it and give me your view about the company.", prompt: "Perform Report Summarization Task:" },
  { main: "Key Facts Extraction", sub: "e.g. Identify the key trend in the technology sector for Q1 2022.", prompt: "Perform Key Facts Extraction Task:" },
  { main: "Market Sentiment Analysis", sub: "e.g. Analyze the sentiment of the following statement...", prompt: "Perform Market Sentiment Analysis Task:" },
  { main: "Investment Strategy", sub: "e.g. You are managing a portfolio for a client who is 45 years old, has moderate risk tolerance, and plans to retire in 20 years. Construct a portfolio using the following assets...", prompt: "Perform Investment Strategy Task:" },
  { main: "Trend Forecast", sub: "e.g. What are the operating expense projections for the next three years based on historical cost trends?", prompt: "Perform Trend Forecast Task:" },
  { main: "Wealth Management", sub: "e.g. What are three key aspects of wealth management you would discuss based on the following context...", prompt: "Perform Wealth Management Task:" },
  { main: "Insurance Claim Processing", sub: "e.g. Given the following claim report, identify and list the key pieces of information that are crucial for processing the insurance claim...", prompt: "Perform Insurance Claim Processing Task:" },
  { main: "ESG Risk Analysis", sub: "e.g. What is the ESG score given the text...", prompt: "Perform ESG Risk Analysis:" }
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