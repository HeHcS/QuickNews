import { useState } from "react";

const topics = [
  { id: 1, name: "For You", active: true },
  { id: 2, name: "Breaking", active: false },
  { id: 3, name: "Politics", active: false },
  { id: 4, name: "Tech", active: false },
  { id: 5, name: "Sports", active: false }
];

export default function TopicsHeader() {
  const [activeTopics, setActiveTopics] = useState(topics);

  const handleTopicClick = (id: number) => {
    setActiveTopics(prevTopics => 
      prevTopics.map(topic => ({
        ...topic,
        active: topic.id === id
      }))
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-20 bg-transparent max-w-[calc(100vh*9/19.5)] mx-auto">
      <div className="flex items-center justify-center py-2 px-2">
        <div className="flex space-x-1 overflow-x-auto no-scrollbar w-full justify-between">
          {activeTopics.map(topic => (
            <button
              key={topic.id}
              onClick={() => handleTopicClick(topic.id)}
              className={`px-2 py-1 text-xs font-medium whitespace-nowrap ${
                topic.active 
                  ? "text-primary border-b-2 border-primary" 
                  : "text-mediumGray"
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
