import { tradingDemoTemplate } from './tradingDemo';
import { behaviorDemoTemplate } from './behaviorDemo';
import { communicationDemoTemplate } from './communicationDemo';
import { spawningDemoTemplate } from './spawningDemo';
import { coordinationDemoTemplate } from './coordinationDemo';
import { cognitiveDemoTemplate } from './cognitiveDemo';

export interface DemoTemplate {
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
}

export const templates: Record<string, DemoTemplate> = {
  tradingDemo: tradingDemoTemplate,
  behaviorDemo: behaviorDemoTemplate,
  communicationDemo: communicationDemoTemplate,
  spawningDemo: spawningDemoTemplate,
  coordinationDemo: coordinationDemoTemplate,
  cognitiveDemo: cognitiveDemoTemplate,
};

export const getTemplate = (name: string): DemoTemplate | null => {
  return templates[name] || null;
};

export const getTemplateList = () => {
  return Object.keys(templates).map(key => ({
    key,
    name: templates[key].name,
    description: templates[key].description
  }));
};
