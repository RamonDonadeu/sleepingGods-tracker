import type { KnowledgeNode } from '../types';

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    REQUIRED_KEYWORD: 'Requiere',
    OPTION: 'Opción',
    OUTCOME: 'Resultado',
    COMBAT: 'Combate',
    RESOURCE: 'Recurso',
    KEYWORD_DISCOVERY: 'Palabra clave',
    TOTEM: 'Tótem',
    NOTE: 'Nota',
  };
  return labels[type] ?? type;
}

function KnowledgeNodeItem({ node, depth = 0 }: { node: KnowledgeNode; depth?: number }) {
  return (
    <li className="knowledge-node" style={{ marginLeft: depth * 16 }}>
      <span className="knowledge-type">{typeLabel(node.type)}</span>
      <span className="knowledge-content">{node.content}</span>
      <span className="muted knowledge-campaign">({node.campaignName})</span>
      {node.children.length > 0 && (
        <ul className="knowledge-tree">
          {node.children.map((child) => (
            <KnowledgeNodeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function KnowledgeTree({ nodes }: { nodes: KnowledgeNode[] }) {
  if (nodes.length === 0) {
    return <p className="muted">Sin conocimiento registrado.</p>;
  }

  return (
    <ul className="knowledge-tree">
      {nodes.map((node) => (
        <KnowledgeNodeItem key={node.id} node={node} />
      ))}
    </ul>
  );
}
