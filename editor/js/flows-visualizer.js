/**
 * Flows Visualizer
 * Provides three visualization modes for game structure:
 * 1. Flowchart - Scene connections and navigation
 * 2. Graph - Item dependencies and relationships
 * 3. Tree - Hierarchical scene/item structure
 */

export class FlowsVisualizer {
    constructor(editor) {
        this.editor = editor;
        this.currentTab = 'flowchart';
        this.container = null;
        this.isVisible = false;
        
        this.init();
    }

    init() {
        this.container = document.getElementById('flows-container');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.flows-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.flowsTab);
            });
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.flows-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.flowsTab === tabName);
        });

        // Update views
        document.querySelectorAll('.flows-view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${tabName}-view`).classList.add('active');

        // Render the selected view
        this.render();
    }

    show() {
        this.isVisible = true;
        this.container.classList.add('active');
        this.render();
    }

    hide() {
        this.isVisible = false;
        this.container.classList.remove('active');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    render() {
        if (!this.isVisible) return;

        switch (this.currentTab) {
            case 'flowchart':
                this.renderFlowchart();
                break;
            case 'graph':
                this.renderGraph();
                break;
            case 'tree':
                this.renderTree();
                break;
        }
    }

    /**
     * Render Scene Flowchart
     * Shows scene connections via links and sequential navigation
     */
    renderFlowchart() {
        const canvas = document.getElementById('flowchart-canvas');
        const scenes = this.editor.data.scenes || [];
        const items = this.editor.data.sceneItems || [];

        if (scenes.length === 0) {
            canvas.innerHTML = '<div class="empty-state">No scenes to display. Add scenes to see the flowchart.</div>';
            return;
        }

        // Build scene connections
        const connections = this.buildSceneConnections(scenes, items);

        // Create SVG flowchart
        const nodeWidth = 200;
        const nodeHeight = 60;
        const verticalSpacing = 100;
        const horizontalSpacing = 250;

        const svgWidth = Math.max(800, nodeWidth + 100);
        const svgHeight = scenes.length * (nodeHeight + verticalSpacing) + 100;

        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

        // Define arrow markers
        svg += `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#666" />
                </marker>
                <marker id="arrowhead-link" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#20b2aa" />
                </marker>
            </defs>
        `;

        // Calculate node positions
        const nodePositions = scenes.map((scene, index) => ({
            x: 50,
            y: 50 + index * (nodeHeight + verticalSpacing),
            scene,
            index
        }));

        // Draw sequential connections first (behind nodes)
        for (let i = 0; i < scenes.length - 1; i++) {
            const from = nodePositions[i];
            const to = nodePositions[i + 1];
            const x1 = from.x + nodeWidth / 2;
            const y1 = from.y + nodeHeight;
            const x2 = to.x + nodeWidth / 2;
            const y2 = to.y;

            svg += `
                <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                      stroke="#666" stroke-width="2" marker-end="url(#arrowhead)" />
                <text x="${x1 + 10}" y="${(y1 + y2) / 2}" fill="#666" font-size="12">next</text>
            `;
        }

        // Draw link connections
        connections.forEach(conn => {
            const fromIndex = scenes.findIndex(s => s.sceneName === conn.from);
            const toIndex = scenes.findIndex(s => s.sceneName === conn.to);
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex - 1) {
                const from = nodePositions[fromIndex];
                const to = nodePositions[toIndex];
                const x1 = from.x + nodeWidth;
                const y1 = from.y + nodeHeight / 2;
                const x2 = to.x + nodeWidth;
                const y2 = to.y + nodeHeight / 2;

                // Curved line for link connections
                const midX = x1 + 80;
                svg += `
                    <path d="M ${x1} ${y1} Q ${midX} ${y1}, ${midX} ${(y1 + y2) / 2} T ${x2} ${y2}"
                          stroke="#20b2aa" stroke-width="2" fill="none"
                          stroke-dasharray="5,5" marker-end="url(#arrowhead-link)" />
                    <text x="${midX + 5}" y="${(y1 + y2) / 2}" fill="#20b2aa" font-size="11">${conn.label}</text>
                `;
            }
        });

        // Draw nodes
        nodePositions.forEach(({ x, y, scene, index }) => {
            const isPuzzle = scene.sceneType === 'puzzle';
            const fill = isPuzzle ? '#f9f' : '#4a9eff';
            const icon = isPuzzle ? '🧩' : '🎬';

            svg += `
                <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}"
                      fill="${fill}" stroke="#333" stroke-width="2" rx="8" />
                <text x="${x + 10}" y="${y + 25}" font-size="20">${icon}</text>
                <text x="${x + 40}" y="${y + 25}" font-size="14" font-weight="bold" fill="#000">
                    ${this.truncateText(scene.title || scene.sceneName, 20)}
                </text>
                <text x="${x + 40}" y="${y + 45}" font-size="11" fill="#333">
                    ${scene.sceneName}
                </text>
            `;
        });

        svg += '</svg>';
        canvas.innerHTML = svg;
    }

    /**
     * Render Item Dependency Graph
     * Shows item relationships (useWith, combineWith, useResult)
     */
    renderGraph() {
        const canvas = document.getElementById('graph-canvas');
        const items = this.editor.data.sceneItems || [];

        if (items.length === 0) {
            canvas.innerHTML = '<div class="empty-state">No items to display. Add items to see the dependency graph.</div>';
            return;
        }

        // Filter items that have relationships
        const connectedItems = items.filter(item =>
            item.useWith || item.combineWith || item.useResult || item.combineResult ||
            items.some(other =>
                other.useWith === item.name ||
                other.combineWith === item.name ||
                other.useResult === item.name ||
                other.combineResult === item.name
            )
        );

        if (connectedItems.length === 0) {
            canvas.innerHTML = '<div class="empty-state">No item relationships defined yet. Use the item editor to set up useWith, combineWith, or result properties.</div>';
            return;
        }

        // Create force-directed layout
        const nodeWidth = 120;
        const nodeHeight = 50;
        const svgWidth = Math.max(1000, canvas.offsetWidth - 40);
        const svgHeight = 600;

        // Position nodes in a circular layout
        const radius = Math.min(svgWidth, svgHeight) / 3;
        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2;

        const nodePositions = connectedItems.map((item, index) => {
            const angle = (index / connectedItems.length) * 2 * Math.PI;
            return {
                x: centerX + radius * Math.cos(angle) - nodeWidth / 2,
                y: centerY + radius * Math.sin(angle) - nodeHeight / 2,
                item
            };
        });

        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;

        // Define arrow markers
        svg += `
            <defs>
                <marker id="arrow-use" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#4a9eff" />
                </marker>
                <marker id="arrow-combine" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#ff9800" />
                </marker>
                <marker id="arrow-result" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="#4caf50" />
                </marker>
            </defs>
        `;

        // Draw connections
        connectedItems.forEach((item, fromIdx) => {
            const from = nodePositions[fromIdx];
            const fromCenterX = from.x + nodeWidth / 2;
            const fromCenterY = from.y + nodeHeight / 2;

            // useWith connections
            if (item.useWith) {
                const toIdx = connectedItems.findIndex(i => i.name === item.useWith);
                if (toIdx !== -1) {
                    const to = nodePositions[toIdx];
                    const toCenterX = to.x + nodeWidth / 2;
                    const toCenterY = to.y + nodeHeight / 2;

                    svg += `
                        <line x1="${fromCenterX}" y1="${fromCenterY}"
                              x2="${toCenterX}" y2="${toCenterY}"
                              stroke="#4a9eff" stroke-width="2" marker-end="url(#arrow-use)" />
                        <text x="${(fromCenterX + toCenterX) / 2}" y="${(fromCenterY + toCenterY) / 2 - 5}"
                              fill="#4a9eff" font-size="10" text-anchor="middle">use</text>
                    `;
                }
            }

            // combineWith connections
            if (item.combineWith) {
                const toIdx = connectedItems.findIndex(i => i.name === item.combineWith);
                if (toIdx !== -1) {
                    const to = nodePositions[toIdx];
                    const toCenterX = to.x + nodeWidth / 2;
                    const toCenterY = to.y + nodeHeight / 2;

                    svg += `
                        <line x1="${fromCenterX}" y1="${fromCenterY}"
                              x2="${toCenterX}" y2="${toCenterY}"
                              stroke="#ff9800" stroke-width="2" stroke-dasharray="5,5"
                              marker-end="url(#arrow-combine)" />
                        <text x="${(fromCenterX + toCenterX) / 2}" y="${(fromCenterY + toCenterY) / 2 - 5}"
                              fill="#ff9800" font-size="10" text-anchor="middle">combine</text>
                    `;
                }
            }

            // useResult connections
            if (item.useResult) {
                const toIdx = connectedItems.findIndex(i => i.name === item.useResult);
                if (toIdx !== -1) {
                    const to = nodePositions[toIdx];
                    const toCenterX = to.x + nodeWidth / 2;
                    const toCenterY = to.y + nodeHeight / 2;

                    svg += `
                        <line x1="${fromCenterX}" y1="${fromCenterY}"
                              x2="${toCenterX}" y2="${toCenterY}"
                              stroke="#4caf50" stroke-width="3" marker-end="url(#arrow-result)" />
                        <text x="${(fromCenterX + toCenterX) / 2}" y="${(fromCenterY + toCenterY) / 2 - 5}"
                              fill="#4caf50" font-size="10" text-anchor="middle">creates</text>
                    `;
                }
            }

            // combineResult connections
            if (item.combineResult) {
                const toIdx = connectedItems.findIndex(i => i.name === item.combineResult);
                if (toIdx !== -1) {
                    const to = nodePositions[toIdx];
                    const toCenterX = to.x + nodeWidth / 2;
                    const toCenterY = to.y + nodeHeight / 2;

                    svg += `
                        <line x1="${fromCenterX}" y1="${fromCenterY}"
                              x2="${toCenterX}" y2="${toCenterY}"
                              stroke="#4caf50" stroke-width="3" marker-end="url(#arrow-result)" />
                        <text x="${(fromCenterX + toCenterX) / 2}" y="${(fromCenterY + toCenterY) / 2 - 5}"
                              fill="#4caf50" font-size="10" text-anchor="middle">creates</text>
                    `;
                }
            }
        });

        // Draw nodes
        nodePositions.forEach(({ x, y, item }) => {
            const colors = {
                'item': '#ffd700',
                'target': '#ff69b4',
                'link': '#20b2aa',
                'decor': '#ddd'
            };
            const fill = colors[item.type] || '#ccc';
            const icon = this.getItemIcon(item.type);

            svg += `
                <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}"
                      fill="${fill}" stroke="#333" stroke-width="2" rx="6" />
                <text x="${x + 10}" y="${y + 25}" font-size="16">${icon}</text>
                <text x="${x + 35}" y="${y + 22}" font-size="12" font-weight="bold" fill="#000">
                    ${this.truncateText(item.longName || item.name, 12)}
                </text>
                <text x="${x + 35}" y="${y + 38}" font-size="9" fill="#333">
                    ${item.type}
                </text>
            `;
        });

        svg += '</svg>';
        canvas.innerHTML = svg;
    }

    /**
     * Render Scene Tree Map
     * Shows hierarchical structure of scenes and their items
     */
    renderTree() {
        const canvas = document.getElementById('tree-canvas');
        const scenes = this.editor.data.scenes || [];
        const items = this.editor.data.sceneItems || [];

        let html = '<div class="tree-container">';
        
        scenes.forEach((scene, sceneIndex) => {
            const sceneItems = items.filter(item => 
                scene.items && scene.items.includes(item.name)
            );

            const sceneClass = scene.sceneType === 'puzzle' ? 'tree-scene-puzzle' : 'tree-scene';
            
            html += `
                <div class="tree-scene-node ${sceneClass}">
                    <div class="tree-scene-header">
                        <span class="tree-scene-icon">${scene.sceneType === 'puzzle' ? '🧩' : '🎬'}</span>
                        <span class="tree-scene-title">${scene.title || scene.sceneName}</span>
                        <span class="tree-scene-name">(${scene.sceneName})</span>
                    </div>
                    <div class="tree-items">
            `;

            if (sceneItems.length > 0) {
                sceneItems.forEach(item => {
                    const icon = this.getItemIcon(item.type);
                    const typeClass = `tree-item-${item.type}`;
                    
                    html += `
                        <div class="tree-item ${typeClass}">
                            <span class="tree-item-icon">${icon}</span>
                            <span class="tree-item-name">${item.longName || item.name}</span>
                            <span class="tree-item-type">${item.type}</span>
                    `;

                    // Show relationships
                    const relationships = [];
                    if (item.useWith) relationships.push(`uses: ${item.useWith}`);
                    if (item.combineWith) relationships.push(`combines: ${item.combineWith}`);
                    if (item.useResult) relationships.push(`→ ${item.useResult}`);
                    if (item.combineResult) relationships.push(`→ ${item.combineResult}`);
                    if (item.linkToScene) relationships.push(`→ ${item.linkToScene}`);

                    if (relationships.length > 0) {
                        html += `<div class="tree-item-relations">${relationships.join(', ')}</div>`;
                    }

                    html += `</div>`;
                });
            } else {
                html += '<div class="tree-no-items">No items in this scene</div>';
            }

            html += `
                    </div>
                </div>
            `;
        });

        html += '</div>';
        canvas.innerHTML = html;
    }

    // Helper methods

    buildSceneConnections(scenes, items) {
        const connections = [];
        
        items.forEach(item => {
            if (item.type === 'link' && item.linkToScene) {
                // Find which scene this link item belongs to
                scenes.forEach(scene => {
                    if (scene.items && scene.items.includes(item.name)) {
                        connections.push({
                            from: scene.sceneName,
                            to: item.linkToScene,
                            label: item.longName || item.name
                        });
                    }
                });
            }
        });

        return connections;
    }

    sanitizeId(str) {
        return str.replace(/[^a-zA-Z0-9]/g, '_');
    }

    getItemIcon(type) {
        const icons = {
            'item': '📦',
            'target': '🎯',
            'link': '🔗',
            'decor': '🎨'
        };
        return icons[type] || '❓';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 1) + '…';
    }
}

