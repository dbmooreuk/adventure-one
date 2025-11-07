/**
 * UI Manager - Handles UI updates and rendering
 */

export class UIManager {
    constructor(editor) {
        this.editor = editor;
    }
    
    hideWelcome() {
        document.getElementById('welcome-screen').classList.remove('active');
    }
    
    showPanel(panelId) {
        // Hide all panels
        document.querySelectorAll('.editor-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById('welcome-screen').classList.remove('active');

        // Show selected panel
        document.getElementById(panelId).classList.add('active');

        // If showing code editor, initialize it
        if (panelId === 'code-editor') {
            this.editor.codeEditor.show();
        }
    }
    
    hidePanel(panelId) {
        document.getElementById(panelId).classList.remove('active');
    }
    
    renderSceneList() {
        const container = document.getElementById('scenes-list-items');
        container.innerHTML = '';
        
        this.editor.data.scenes.forEach(scene => {
            const li = document.createElement('li');
            li.dataset.sceneName = scene.sceneName;
            
            const typeClass = scene.sceneType === 'puzzle' ? 'type-puzzle' : 'type-scene';
            
            li.innerHTML = `
                <div class="item-list-title">${scene.title}</div>
                <div class="item-list-meta">
                    <span class="item-type-badge ${typeClass}">${scene.sceneType}</span>
                    <span>${scene.sceneName}</span>
                    ${scene.items ? ` • ${scene.items.length} items` : ''}
                </div>
            `;
            
            li.addEventListener('click', () => {
                this.selectScene(scene.sceneName);
            });
            
            container.appendChild(li);
        });
    }
    
    renderItemList(filter = '', typeFilter = '') {
        const container = document.getElementById('items-list-items');
        container.innerHTML = '';
        
        let items = this.editor.data.sceneItems;
        
        // Apply filters
        if (filter) {
            const lowerFilter = filter.toLowerCase();
            items = items.filter(item => 
                item.name.toLowerCase().includes(lowerFilter) ||
                item.longName.toLowerCase().includes(lowerFilter)
            );
        }
        
        if (typeFilter) {
            items = items.filter(item => item.type === typeFilter);
        }
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.dataset.itemName = item.name;
            
            const typeClass = `type-${item.type}`;
            
            li.innerHTML = `
                <div class="item-list-title">${item.longName || item.name}</div>
                <div class="item-list-meta">
                    <span class="item-type-badge ${typeClass}">${item.type}</span>
                    <span>${item.name}</span>
                </div>
            `;
            
            li.addEventListener('click', () => {
                this.selectItem(item.name);
            });
            
            container.appendChild(li);
        });
        
        if (items.length === 0) {
            container.innerHTML = '<li style="padding: 20px; text-align: center; color: var(--editor-text-dim);">No items found</li>';
        }
    }
    
    filterScenes(query) {
        const items = document.querySelectorAll('#scenes-list-items li');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(lowerQuery) ? '' : 'none';
        });
    }
    
    filterItems(query, type = '') {
        this.renderItemList(query, type);
    }
    
    selectScene(sceneName) {
        // Auto-save current work before switching
        this.editor.saveCurrentWork();

        // Update list selection
        document.querySelectorAll('#scenes-list-items li').forEach(li => {
            li.classList.toggle('active', li.dataset.sceneName === sceneName);
        });

        this.editor.selectedScene = sceneName;
        this.editor.sceneEditor.edit(sceneName);
    }

    selectItem(itemName) {
        // Auto-save current work before switching
        this.editor.saveCurrentWork();

        // Update list selection
        document.querySelectorAll('#items-list-items li').forEach(li => {
            li.classList.toggle('active', li.dataset.itemName === itemName);
        });

        this.editor.selectedItem = itemName;
        this.editor.itemEditor.edit(itemName);
    }
    
    updateCounts() {
        document.getElementById('scene-count').textContent = 
            `${this.editor.data.scenes.length} scene${this.editor.data.scenes.length !== 1 ? 's' : ''}`;
        document.getElementById('item-count').textContent = 
            `${this.editor.data.sceneItems.length} item${this.editor.data.sceneItems.length !== 1 ? 's' : ''}`;
    }
    
    setStatus(message, type = 'info') {
        const statusEl = document.getElementById('status-message');
        statusEl.textContent = message;
        statusEl.className = '';
        
        if (type === 'success') statusEl.classList.add('text-success');
        if (type === 'warning') statusEl.classList.add('text-warning');
        if (type === 'danger') statusEl.classList.add('text-danger');
        
        // Clear after 3 seconds
        setTimeout(() => {
            statusEl.textContent = 'Ready';
            statusEl.className = '';
        }, 3000);
    }
    
    showModal(title, message, onConfirm) {
        const modal = document.getElementById('modal');
        document.getElementById('modal-title').textContent = title;

        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `<p>${message}</p>`;

        const modalActions = document.getElementById('modal-actions');
        modalActions.innerHTML = `
            <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'">Cancel</button>
            <button id="modal-confirm-btn" class="btn btn-primary">Confirm</button>
        `;

        modal.style.display = 'flex';

        document.getElementById('modal-confirm-btn').addEventListener('click', () => {
            this.hideModal();
            if (onConfirm) onConfirm();
        });
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
    }
    
    /**
     * Create a form field based on schema definition
     */
    createFormField(fieldName, fieldDef, value = null, data = {}) {
        // Check condition
        if (fieldDef.condition && !fieldDef.condition(data)) {
            return null;
        }
        
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        formGroup.dataset.field = fieldName;
        
        const label = document.createElement('label');
        label.textContent = fieldDef.label;
        if (fieldDef.required) {
            const required = document.createElement('span');
            required.className = 'required';
            required.textContent = ' *';
            label.appendChild(required);
        }
        formGroup.appendChild(label);
        
        let input;
        
        switch (fieldDef.type) {
            case 'textarea':
                input = document.createElement('textarea');
                input.value = value || '';
                break;
                
            case 'select':
                input = document.createElement('select');
                fieldDef.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (value === opt) option.selected = true;
                    input.appendChild(option);
                });
                break;
                
            case 'boolean':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value || false;
                break;
                
            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.value = value !== null && value !== undefined ? value : (fieldDef.default || '');
                if (fieldDef.min !== undefined) input.min = fieldDef.min;
                if (fieldDef.max !== undefined) input.max = fieldDef.max;
                if (fieldDef.step !== undefined) input.step = fieldDef.step;
                break;
                
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.value = value || '';
        }
        
        input.name = fieldName;
        input.id = `field-${fieldName}`;
        formGroup.appendChild(input);
        
        if (fieldDef.help) {
            const help = document.createElement('div');
            help.className = 'form-help';
            help.textContent = fieldDef.help;
            formGroup.appendChild(help);
        }
        
        return formGroup;
    }
}

