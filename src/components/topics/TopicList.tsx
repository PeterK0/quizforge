import { Topic } from '../../types';
import { TopicItem } from './TopicItem';

interface TopicListProps {
  topics: Topic[];
  onTopicClick: (topic: Topic) => void;
  onEditTopic: (topic: Topic) => void;
  onDeleteTopic: (topic: Topic) => void;
  onQuizzesClick?: (topic: Topic) => void;
}

export function TopicList({
  topics,
  onTopicClick,
  onEditTopic,
  onDeleteTopic,
  onQuizzesClick,
}: TopicListProps) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          No topics yet
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Create your first topic to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <TopicItem
          key={topic.id}
          topic={topic}
          onClick={() => onTopicClick(topic)}
          onEdit={() => onEditTopic(topic)}
          onDelete={() => onDeleteTopic(topic)}
          onQuizzesClick={onQuizzesClick ? () => onQuizzesClick(topic) : undefined}
        />
      ))}
    </div>
  );
}
