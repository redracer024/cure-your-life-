import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PatternEntry } from '../../types/patterns';

interface PatternMindMapProps {
  pattern: PatternEntry;
}

interface MindMapNode {
  label: string;
  items?: string[];
  children?: MindMapNode[];
}

// Parse body themes into grouped sub-branches
function parseBodyThemes(bodyThemes: string): MindMapNode[] {
  const regions: Record<string, string[]> = {
    'Spine and Back': [],
    'Head and Neck': [],
    'Internal Systems': [],
  };

  const items = bodyThemes.split('. ').filter(s => s.trim());

  for (const item of items) {
    const cleaned = item.endsWith('.') ? item.slice(0, -1) : item;
    const lower = cleaned.toLowerCase();

    if (lower.includes('back') || lower.includes('shoulder') || lower.includes('sciatica') || lower.includes('spine')) {
      regions['Spine and Back'].push(cleaned);
    } else if (lower.includes('head') || lower.includes('neck') || lower.includes('jaw') || lower.includes('tmj') || lower.includes('migraine') || lower.includes('cervical') || lower.includes('throat')) {
      regions['Head and Neck'].push(cleaned);
    } else {
      regions['Internal Systems'].push(cleaned);
    }
  }

  const nodes: MindMapNode[] = [];
  for (const [region, items] of Object.entries(regions)) {
    if (items.length > 0) {
      nodes.push({ label: region, items });
    }
  }

  return nodes;
}

// Parse relationship pattern into discrete points
function parseRelationshipPattern(pattern: string): string[] {
  return pattern
    .split('. ')
    .filter(s => s.trim())
    .map(s => s.endsWith('.') ? s.slice(0, -1) : s);
}

export const PatternMindMap: React.FC<PatternMindMapProps> = ({ pattern }) => {
  const config = pattern.mindMapConfig;
  const labels = config?.branchLabels || {};

  const defaultExpanded = pattern.coreBeliefs && pattern.coreBeliefs.length > 0
    ? new Set([labels.coreBeliefs || 'Core Beliefs', labels.protectiveStrategies || 'Protective Strategies', labels.emotionalSignature || 'Emotional Signature'])
    : new Set([labels.coreProfile || 'Core Profile', labels.protectiveStrategies || 'Protective Strategies', labels.emotionalSignature || 'Emotional Signature']);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(defaultExpanded);

  const branches: MindMapNode[] = useMemo(() => {
    const branchMap: Record<string, MindMapNode> = {};

    // Core Profile or Core Beliefs
    if (pattern.coreBeliefs && pattern.coreBeliefs.length > 0) {
      branchMap['coreBeliefs'] = {
        label: labels.coreBeliefs || 'Core Beliefs',
        items: pattern.coreBeliefs,
      };
    } else {
      branchMap['coreProfile'] = {
        label: labels.coreProfile || 'Core Profile',
        items: [
          `Description: ${pattern.shortDescription.slice(0, 120)}${pattern.shortDescription.length > 120 ? '...' : ''}`,
          `Core Belief: ${pattern.coreBelief.replace(/[""]/g, '').slice(0, 100)}`,
          `Protective Strategy: ${pattern.protectiveStrategy.split('.')[0]}`,
        ],
      };
    }

    // Protective Strategies
    branchMap['protectiveStrategies'] = {
      label: labels.protectiveStrategies || 'Protective Strategies',
      items: pattern.protectiveStrategy
        .split('. ')
        .filter(s => s.trim())
        .map(s => s.endsWith('.') ? s.slice(0, -1) : s)
        .slice(0, 5),
    };

    // Body Themes / Somatic Manifestations
    const bodyLabel = labels.bodyThemes || labels.somaticManifestations || 'Body Themes';
    branchMap['bodyThemes'] = {
      label: bodyLabel,
      children: parseBodyThemes(pattern.bodyThemes),
    };

    // Emotional Signature
    branchMap['emotionalSignature'] = {
      label: labels.emotionalSignature || 'Emotional Signature',
      items: pattern.emotionalSignature,
    };

    // Sub-Patterns / Behavioral Sub-Patterns
    if (pattern.subPatterns.length > 0) {
      const subLabel = labels.subPatterns || labels.behavioralSubPatterns || 'Sub-Patterns';
      branchMap['subPatterns'] = {
        label: subLabel,
        items: pattern.subPatterns.map(sp => {
          const desc = sp.summary ?? sp.description ?? '';
          return desc ? `${sp.name}: ${desc}` : sp.name;
        }),
      };
    }

    // Origins
    if (pattern.whereItOftenStarts.length > 0) {
      branchMap['origins'] = {
        label: labels.origins || 'Origins',
        items: pattern.whereItOftenStarts.slice(0, 5),
      };
    }

    // Relationship Pattern / Relationship Patterns
    branchMap['relationshipPattern'] = {
      label: labels.relationshipPattern || labels.relationshipPatterns || 'Relationship Pattern',
      items: parseRelationshipPattern(pattern.relationshipPattern),
    };

    // Somatic & Deeper Context (if present)
    if (pattern.somaticContext) {
      const children: MindMapNode[] = [];

      if (pattern.somaticContext.jungianArchetypes) {
        for (const jungian of pattern.somaticContext.jungianArchetypes) {
          children.push({
            label: jungian.name,
            items: jungian.items,
          });
        }
      }

      if (pattern.somaticContext.additionalItems) {
        children.push({
          label: 'Additional Context',
          items: pattern.somaticContext.additionalItems,
        });
      }

      const contextLabel = labels.somaticContext || labels.deeperContext || 'Somatic & Deeper Context';
      branchMap['somaticContext'] = {
        label: contextLabel,
        children: children.length > 0 ? children : undefined,
        items: children.length === 0 ? ['No additional somatic context'] : undefined,
      };
    }

    // Pattern Pairings
    branchMap['patternPairings'] = {
      label: labels.patternPairings || 'Pattern Pairings',
      items: pattern.patternPairings.map(p => `${p.pairsWith}: ${p.looksLike}`),
    };

    // Linked Symptoms
    if (pattern.commonLinkedSymptoms.length > 0) {
      branchMap['linkedSymptoms'] = {
        label: labels.linkedSymptoms || 'Linked Symptoms',
        items: pattern.commonLinkedSymptoms.slice(0, 6),
      };
    }

    // Reset Protocol
    branchMap['resetProtocol'] = {
      label: labels.resetProtocol || pattern.resetProtocolLabel || '2-Minute Reset Protocol',
      items: pattern.resetProtocol.steps,
    };

    // Default branch order
    const defaultOrder = [
      'coreProfile', 'coreBeliefs',
      'protectiveStrategies',
      'bodyThemes',
      'emotionalSignature',
      'subPatterns',
      'origins',
      'relationshipPattern',
      'linkedSymptoms',
      'somaticContext',
      'patternPairings',
      'resetProtocol',
    ];

    // Apply custom ordering if provided
    const order = config?.branchOrder || defaultOrder;
    const hidden = new Set(config?.hideBranches || []);

    // Build result: ordered branches + any not in order at the end
    const result: MindMapNode[] = [];
    const used = new Set<string>();

    for (const key of order) {
      if (hidden.has(key)) continue;
      if (branchMap[key]) {
        result.push(branchMap[key]);
        used.add(key);
      }
    }

    // Add any remaining branches not in the order
    for (const [key, branch] of Object.entries(branchMap)) {
      if (!used.has(key) && !hidden.has(key)) {
        result.push(branch);
      }
    }

    return result;
  }, [pattern, labels, config]);

  const toggleNode = useCallback((path: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allPaths = new Set<string>();
    const collect = (nodes: MindMapNode[], prefix: string) => {
      for (const node of nodes) {
        allPaths.add(prefix ? `${prefix}/${node.label}` : node.label);
        if (node.children) {
          collect(node.children, prefix ? `${prefix}/${node.label}` : node.label);
        }
      }
    };
    collect(branches, '');
    setExpandedNodes(allPaths);
  }, [branches]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={expandAll}
          className="px-3 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-white/5 rounded-lg hover:border-white/10 transition-all cursor-pointer"
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="px-3 py-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 border border-white/5 rounded-lg hover:border-white/10 transition-all cursor-pointer"
        >
          Collapse All
        </button>
      </div>

      {/* Mind Map */}
      <div className="relative overflow-x-auto pb-4">
        <div className="flex items-start gap-0 min-w-max">
          {/* Root Node */}
          <div className="sticky left-0 z-20 flex-shrink-0 pt-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-5 py-3 rounded-2xl border-2 font-black uppercase tracking-tight text-sm font-display whitespace-nowrap"
              style={{
                borderColor: pattern.color + '60',
                background: pattern.color + '15',
                color: pattern.color,
                boxShadow: `0 0 30px ${pattern.glowColor}`,
              }}
            >
              {pattern.name}
            </motion.div>
          </div>

          {/* Connecting Line */}
          <div className="flex-shrink-0 w-12 flex items-center pt-10">
            <div className="w-full h-0.5" style={{ background: pattern.color + '30' }} />
          </div>

          {/* Branches */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            {branches.map((branch, branchIdx) => (
              <BranchNode
                key={branch.label}
                branch={branch}
                patternColor={pattern.color}
                expandedNodes={expandedNodes}
                onToggle={toggleNode}
                path={branch.label}
                depth={0}
                branchIdx={branchIdx}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const BranchNode: React.FC<{
  branch: MindMapNode;
  patternColor: string;
  expandedNodes: Set<string>;
  onToggle: (path: string) => void;
  path: string;
  depth: number;
  branchIdx: number;
}> = ({ branch, patternColor, expandedNodes, onToggle, path, depth, branchIdx }) => {
  const isExpanded = expandedNodes.has(path);
  const hasChildren = branch.children && branch.children.length > 0;
  const hasItems = branch.items && branch.items.length > 0;
  const staggerDelay = branchIdx * 0.04;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: staggerDelay }}
      className="flex items-start"
    >
      {/* Branch Connector */}
      <div className="flex-shrink-0 w-8 flex items-center pt-4">
        <div className="w-full h-0.5" style={{ background: patternColor + '20' }} />
      </div>

      {/* Branch Node */}
      <button
        onClick={() => onToggle(path)}
        className="flex-shrink-0 px-4 py-2.5 rounded-xl border font-black uppercase tracking-tight text-xs font-display whitespace-nowrap transition-all cursor-pointer hover:scale-[1.02]"
        style={{
          borderColor: isExpanded ? patternColor + '50' : patternColor + '20',
          background: isExpanded ? patternColor + '12' : patternColor + '06',
          color: isExpanded ? patternColor : patternColor + 'CC',
          boxShadow: isExpanded ? `0 0 20px ${patternColor}10` : 'none',
        }}
      >
        {branch.label}
        <span className="ml-1.5 text-[9px] opacity-50">
          {isExpanded ? '▾' : '▸'}
        </span>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex items-start"
          >
            {/* Connecting Line */}
            <div className="flex-shrink-0 w-8 flex items-center pt-4">
              <div className="w-full h-0.5" style={{ background: patternColor + '15' }} />
            </div>

            {/* Items or Children */}
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {/* Direct Items */}
              {hasItems && branch.items!.map((item, itemIdx) => (
                <motion.div
                  key={`item-${itemIdx}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: itemIdx * 0.03 }}
                  className="px-3 py-1.5 rounded-lg border text-[11px] font-sans font-light leading-5 max-w-[280px] whitespace-normal"
                  style={{
                    borderColor: patternColor + '15',
                    background: patternColor + '06',
                    color: '#CBD5E1',
                  }}
                >
                  {item}
                </motion.div>
              ))}

              {/* Child Branches */}
              {hasChildren && branch.children!.map((child, childIdx) => (
                <BranchNode
                  key={child.label}
                  branch={child}
                  patternColor={patternColor}
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                  path={`${path}/${child.label}`}
                  depth={depth + 1}
                  branchIdx={childIdx}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
