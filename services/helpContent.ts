import type { ReactNode } from 'react';

export interface HelpTopic {
  id: string;
  titleKey: string;
  contentKey: string;
}

export interface HelpCategory {
  id: string;
  titleKey: string;
  icon: 'CompassIcon' | 'BeakerIcon' | 'WrenchScrewdriverIcon' | 'BookOpenIcon';
  topics: HelpTopic[];
}

export const helpContent: HelpCategory[] = [
  {
    id: 'analysis',
    titleKey: 'help_category_analysis',
    icon: 'CompassIcon',
    topics: [
      { id: 'scanner', titleKey: 'help_topic_scanner_title', contentKey: 'help_topic_scanner_content' },
      { id: 'heatmap', titleKey: 'help_topic_heatmap_title', contentKey: 'help_topic_heatmap_content' },
      { id: 'presets', titleKey: 'help_topic_presets_title', contentKey: 'help_topic_presets_content' },
      { id: 'alerts', titleKey: 'help_topic_alerts_title', contentKey: 'help_topic_alerts_content' },
    ],
  },
  {
    id: 'strategies',
    titleKey: 'help_category_strategies',
    icon: 'BeakerIcon',
    topics: [
      { id: 'what_is_strategy', titleKey: 'help_topic_what_is_strategy_title', contentKey: 'help_topic_what_is_strategy_content' },
      { id: 'configuration', titleKey: 'help_topic_configuration_title', contentKey: 'help_topic_configuration_content' },
      { id: 'optimization', titleKey: 'help_topic_optimization_title', contentKey: 'help_topic_optimization_content' },
      { id: 'ai_generator', titleKey: 'help_topic_ai_generator_title', contentKey: 'help_topic_ai_generator_content' },
    ],
  },
  {
    id: 'trading',
    titleKey: 'help_category_trading',
    icon: 'WrenchScrewdriverIcon',
    topics: [
      { id: 'risk_management', titleKey: 'help_topic_risk_management_title', contentKey: 'help_topic_risk_management_content' },
      { id: 'trade_lifecycle', titleKey: 'help_topic_trade_lifecycle_title', contentKey: 'help_topic_trade_lifecycle_content' },
      { id: 'modes', titleKey: 'help_topic_modes_title', contentKey: 'help_topic_modes_content' },
      { id: 'journal', titleKey: 'help_topic_journal_title', contentKey: 'help_topic_journal_content' },
    ],
  },
  {
    id: 'getting_started',
    titleKey: 'help_category_getting_started',
    icon: 'BookOpenIcon',
    topics: [
      { id: 'first_steps', titleKey: 'help_topic_first_steps_title', contentKey: 'help_topic_first_steps_content' },
      { id: 'glossary', titleKey: 'help_topic_glossary_title', contentKey: 'help_topic_glossary_content' },
    ],
  },
];

export const getArticleById = (id: string): HelpTopic | undefined => {
    for (const category of helpContent) {
        const topic = category.topics.find(t => t.id === id);
        if (topic) {
            return topic;
        }
    }
    return undefined;
};
