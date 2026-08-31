import { Link } from 'react-router-dom';
import type { DiagramNode } from '../api/knowledge';

const kindIcon: Record<DiagramNode['kind'], string> = {
  access: '🔑',
  mandatory: '⚡',
  option: '↳',
  success: '✓',
  failure: '✗',
  reward: '🎁',
  location: '📍',
};

const kindClass: Record<DiagramNode['kind'], string> = {
  access: 'flow-node-access',
  mandatory: 'flow-node-mandatory',
  option: 'flow-node-option',
  success: 'flow-node-success',
  failure: 'flow-node-failure',
  reward: 'flow-node-reward',
  location: 'flow-node-location',
};

function FlowConnector() {
  return (
    <div className="flow-connector" aria-hidden="true">
      <span className="flow-line" />
      <span className="flow-arrow">▼</span>
    </div>
  );
}

function LocationLink({ code }: { code: string }) {
  return (
    <Link
      className="flow-node-link"
      to={`/go/${encodeURIComponent(code)}`}
      onClick={(event) => event.stopPropagation()}
    >
      #{code}
    </Link>
  );
}

function FlowNodeHeader({ node }: { node: DiagramNode }) {
  return (
    <>
      <span className="flow-node-icon" aria-hidden="true">
        {node.cycle ? '↩' : kindIcon[node.kind]}
      </span>
      <div className="flow-node-text">
        <span className="flow-node-label">{node.label}</span>
        {node.detail && <span className="flow-node-detail">{node.detail}</span>}
        {node.returnToShip && (
          <span className="flow-node-badge">🚢 Volver al barco</span>
        )}
      </div>
      {node.destination != null && (
        <LocationLink code={node.destination} />
      )}
    </>
  );
}

function FlowSteps({
  nodes,
  nested = false,
}: {
  nodes: DiagramNode[];
  nested?: boolean;
}) {
  return (
    <>
      {nodes.map((node, index) => (
        <div key={node.id} className="flow-step">
          {index > 0 && <FlowConnector />}
          <FlowNode node={node} nested={nested} />
        </div>
      ))}
    </>
  );
}

function FlowNode({
  node,
  nested = false,
}: {
  node: DiagramNode;
  nested?: boolean;
}) {
  const isCollapsibleLocation =
    node.kind === 'location' && node.children.length > 0;

  if (isCollapsibleLocation) {
    return (
      <div className={`flow-node-wrap ${nested ? 'flow-node-nested' : ''}`}>
        <details className="flow-location-details">
          <summary
            className={`flow-node ${kindClass.location}${node.cycle ? ' flow-node-cycle' : ''}`}
          >
            <FlowNodeHeader node={node} />
          </summary>
          <div className="flow-subdiagram">
            <FlowSteps nodes={node.children} nested />
          </div>
        </details>
      </div>
    );
  }

  const childContainerClass =
    node.kind === 'location' ? 'flow-subdiagram' : 'flow-children';

  return (
    <div className={`flow-node-wrap ${nested ? 'flow-node-nested' : ''}`}>
      <div
        className={`flow-node ${kindClass[node.kind]}${node.cycle ? ' flow-node-cycle' : ''}`}
      >
        <FlowNodeHeader node={node} />
      </div>

      {node.children.length > 0 && (
        <div className={childContainerClass}>
          {node.kind === 'location' ? (
            <FlowSteps nodes={node.children} nested />
          ) : (
            node.children.map((child) => (
              <FlowNode key={child.id} node={child} nested />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function PathDiagram({ nodes }: { nodes: DiagramNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="muted">Aún no hay caminos registrados para esta localización.</p>
    );
  }

  return (
    <div className="path-diagram">
      <FlowSteps nodes={nodes} />
    </div>
  );
}
