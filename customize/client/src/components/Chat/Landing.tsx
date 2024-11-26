import React, { useState, useEffect, useMemo } from 'react';
import { EModelEndpoint, Constants } from 'librechat-data-provider';
import { useGetEndpointsQuery, useGetStartupConfig } from 'librechat-data-provider/react-query';
import { useChatContext, useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useGetAssistantDocsQuery } from '~/data-provider';
import { getIconEndpoint, getEntity } from '~/utils';
import { useLocalize, useSubmitMessage } from '~/hooks';
import ConvoStarter from './ConvoStarter';
import logo from '~/components/svg/hkust-sbm.svg';
import { useRecoilState } from 'recoil';
import store from '~/store';

const Carousel3D = ({ items, isDayMode, onItemClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prevIndex => (prevIndex + 1) % items.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [items.length]);

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const radius = '20vw';

  return (
    <div className="carousel-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '60%',
      margin: '0 auto'
    }}>
      <div className="carousel-container" style={{
        width: '100%',
        height: '30vh',
        perspective: '1000px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}>
        <div className="carousel-rotation" style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 1s',
        }}>
          {items.map((item, index) => {
            const isActive = currentIndex === index;
            const offset = index - currentIndex;
            const zPosition = isActive ? 0 : -100 * Math.abs(offset);

            return (
              <div
                key={index}
                className="carousel-item"
                onClick={() => onItemClick(item.prompt)}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  backgroundColor: isDayMode ? 'white' : 'black',
                  color: isDayMode ? 'black' : 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                  transform: `
                    translateX(${offset * 120}%) 
                    translateZ(${zPosition}px)
                    scale(${isActive ? 1 : 0.7})
                  `,
                  opacity: isActive ? 1 : 0.3,
                  transition: 'all 0.5s',
                  cursor: 'pointer',
                }}
              >
                <div style={{ 
                  fontSize: 'clamp(16px, 8vw, 20px)',
                  padding: '4px',
                  fontWeight: '500'
                }}>
                  {item.main}
                </div>
                <div style={{ 
                  fontSize: 'clamp(14px, 4vw, 18px)',
                  marginTop: '4px',
                  padding: '2px',
                  fontWeight: '300'
                }}>
                  {item.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{
        position: 'absolute',
        bottom: '+20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        width: '100%',
        zIndex: 10
      }}>
        {items.map((_, index) => (
          <div
            key={index}
            onClick={() => handleDotClick(index)}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: currentIndex === index ? '#000' : '#ccc',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
          />
        ))}
      </div>
    </div>
  );
};
const determineDayMode = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const colorSchemeQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(colorSchemeQueryList.matches);

    const handleChange = () => {
      setDarkMode(colorSchemeQueryList.matches);
    };

    colorSchemeQueryList.addEventListener('change', handleChange);

    return () => {
      colorSchemeQueryList.removeEventListener('change', handleChange);
    };
  }, []);

  return darkMode;
};

export default function Landing({ Header }) {
  const { conversation } = useChatContext();
  const agentsMap = useAgentsMapContext();
  const assistantMap = useAssistantsMapContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const [selectedPrompt, setSelectedPrompt] = useState('');

  const localize = useLocalize();

  let { endpoint = '' } = conversation ?? {};

  endpoint = [EModelEndpoint.chatGPTBrowser, EModelEndpoint.azureOpenAI, EModelEndpoint.gptPlugins].includes(endpoint) ? EModelEndpoint.openAI : endpoint;

  const iconURL = conversation?.iconURL;
  endpoint = getIconEndpoint({ endpointsConfig, iconURL, endpoint });
  const { data: documentsMap = new Map() } = useGetAssistantDocsQuery(endpoint, {
    select: data => new Map(data.map(dbA => [dbA.assistant_id, dbA])),
  });

  const { entity, isAgent, isAssistant } = getEntity({
    endpoint,
    agentsMap,
    assistantMap,
    agent_id: conversation?.agent_id,
    assistant_id: conversation?.assistant_id,
  });

  const conversation_starters = useMemo(() => {
    /* The user made updates, use client-side cache, or they exist in an Agent */
    if (entity && (entity.conversation_starters?.length ?? 0) > 0) {
      return entity.conversation_starters;
    }
    if (isAgent) {
      return entity?.conversation_starters ?? [];
    }

    /* If none in cache, we use the latest assistant docs */
    const entityDocs = documentsMap.get(entity?.id ?? '');
    return entityDocs?.conversation_starters ?? [];
  }, [documentsMap, isAgent, entity]);


  const { submitMessage } = useSubmitMessage();
  const sendConversationStarter = text => submitMessage({ text });

  const TaskMessages = [
    {
      main: "Text Summarization",
      sub: <>e.g. 'Can you summarize this financial report?'<br />(User provides text of the report.)</>,
      prompt: "Perform Text Summarization Task:"
    },
    {
      main: "Sentiment Analysis",
      sub: <>e.g. 'What is the sentiment in this paragraph of earnings call transcript?'<br />(User provides the transcript.)</>,
      prompt: "Perform Sentiment Analysis Task:"
    },
    {
      main: "Risk Analysis",
      sub: <>e.g. 'Analyze the risks associated with this investment portfolio.'<br />(User provides portfolio details.)</>,
      prompt: "Perform Risk Analysis Task:"
    },
    {
      main: "Financial Document Processing",
      sub: <>e.g. 'Given the following claim report, identify and list the key pieces of information crucial for processing the insurance claim.'<br />(User provides claim report text.)</>,
      prompt: "Perform Financial Document Processing Task:"
    },
    {
      main: "Entity Recognition",
      sub: <>e.g. 'Identify key entities in this news article.'<br />(User provides text from the annual report.)</>,
      prompt: "Perform Entity Recognition Task:"
    },
    {
      main: "Business Event Detection",
      sub: <>e.g. 'Detect any major events in this news article.'<br />(User provides the article text.)</>,
      prompt: "Perform Business Event Detection Task:"
    },
    {
      main: "ESG Analysis",
      sub: <>e.g. 'Provide an ESG analysis based on this report.'<br />(User provides the ESG report.)</>,
      prompt: "Perform ESG Risk Analysis:"
    },
    {
      main: "Question Answering",
      sub: <>e.g. 'Compare the revenue growth of Company A and Company B based on this financial report.'<br />(User provides the financial report text including tables.)</>,
      prompt: "Perform Question Answering Task:"
    }
  ];
  const isDayMode = determineDayMode();

  const { newConversation, index } = useChatContext();
  const [activePrompt, setActivePrompt] = useRecoilState(store.activePromptByIndex(index));

  const handleCarouselItemClick = async (prompt) => {
    try {
      await newConversation();
      setActivePrompt(prompt);
    } catch (error) {
      console.error('Error handling task click:', error);
    }
  };


  return (
    <div className="relative h-full">
      <div className="absolute left-0 right-0">{Header}</div>
      <div className="flex h-full flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
        <div 
          className="text-2xl mb-12 flex flex-col items-center space-y-6" 
          style={{ color: isDayMode ? 'white' : 'black' }}
        >
          {/* <img 
              src={logo} 
              style={{ 
                height: '150px', 
                width: '150px',
                filter: isDayMode ? 'invert(1) brightness(100)' : 'none' 
              }} 
              alt="HKUST Logo" 
              className="object-contain mb-2"
            /> */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold">
            InvestLM Generative AI Platform
            </h1>
          </div>
        </div>
      </div>
        <Carousel3D 
          items={TaskMessages} 
          isDayMode={isDayMode} 
          onItemClick={handleCarouselItemClick} 
        />

        <div className="mt-8 flex flex-wrap justify-center gap-3 px-4">
            {/* <div>Selected Prompt For: {selectedPrompt}</div> */}
            {conversation_starters.slice(0, Constants.MAX_CONVO_STARTERS).map((text, index) => (
              <ConvoStarter 
                key={`${selectedPrompt}-${index}`}
                text={`${selectedPrompt}: ${text}`}
                onClick={() => sendConversationStarter(`${selectedPrompt}: ${text}`)} 
              />
            ))}
          </div>
      </div>
      </div>
  );
}