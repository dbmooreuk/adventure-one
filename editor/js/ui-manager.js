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
            li.draggable = true;

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

            // Drag events for composer
            li.addEventListener('dragstart', (e) => {
                const composerActive = document.getElementById('composer-container')?.classList.contains('active');
                if (composerActive) {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('application/json', JSON.stringify(item));
                    li.classList.add('dragging');

                    // Setup drop zone
                    const wrapper = document.querySelector('.composer-canvas-wrapper');
                    if (wrapper) {
                        wrapper.addEventListener('dragover', this.editor.sceneComposer.handleCanvasDragOver);
                        wrapper.addEventListener('drop', this.editor.sceneComposer.handleCanvasDrop);
                    }
                } else {
                    e.preventDefault();
                }
            });

            li.addEventListener('dragend', () => {
                li.classList.remove('dragging');

                const wrapper = document.querySelector('.composer-canvas-wrapper');
                if (wrapper) {
                    wrapper.removeEventListener('dragover', this.editor.sceneComposer.handleCanvasDragOver);
                    wrapper.removeEventListener('drop', this.editor.sceneComposer.handleCanvasDrop);
                }
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

        // Check if composer is active
        const composerActive = document.getElementById('composer-container')?.classList.contains('active');

        if (composerActive) {
            // Load scene into composer instead of scene editor
            this.editor.sceneComposer.loadScene(sceneName);
        } else {
            // Normal scene editor
            this.editor.sceneEditor.edit(sceneName);
        }
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

            case 'multi-select-dropdown':
                // Create custom multi-select dropdown with checkboxes
                input = document.createElement('div');
                input.className = 'multi-select-dropdown';
                input.dataset.fieldName = fieldName;

                // Normalize value to array
                const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

                // Create display button
                const displayBtn = document.createElement('button');
                displayBtn.type = 'button';
                displayBtn.className = 'multi-select-display';
                displayBtn.textContent = selectedValues.length > 0 ? selectedValues.join(', ') : 'Select options...';
                input.appendChild(displayBtn);

                // Create dropdown options container
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'multi-select-options';
                optionsContainer.style.display = 'none';

                fieldDef.options.forEach(opt => {
                    const optionLabel = document.createElement('label');
                    optionLabel.className = 'multi-select-option';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.value = opt;
                    checkbox.checked = selectedValues.includes(opt);

                    const span = document.createElement('span');
                    span.textContent = opt;

                    optionLabel.appendChild(checkbox);
                    optionLabel.appendChild(span);
                    optionsContainer.appendChild(optionLabel);

                    // Update display when checkbox changes
                    checkbox.addEventListener('change', () => {
                        const checked = Array.from(optionsContainer.querySelectorAll('input[type="checkbox"]:checked'))
                            .map(cb => cb.value);
                        displayBtn.textContent = checked.length > 0 ? checked.join(', ') : 'Select options...';
                    });
                });

                input.appendChild(optionsContainer);

                // Toggle dropdown on button click
                displayBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = optionsContainer.style.display === 'block';
                    // Close all other dropdowns
                    document.querySelectorAll('.multi-select-options').forEach(el => el.style.display = 'none');
                    optionsContainer.style.display = isVisible ? 'none' : 'block';
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!input.contains(e.target)) {
                        optionsContainer.style.display = 'none';
                    }
                });

                break;

            case 'multi-select':
                input = document.createElement('select');
                input.multiple = true;
                input.size = Math.min(fieldDef.options.length, 4);

                // Normalize value to array
                const selectedVals = Array.isArray(value) ? value : (value ? [value] : []);

                fieldDef.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    if (selectedVals.includes(opt)) option.selected = true;
                    input.appendChild(option);
                });
                break;

            case 'item-select':
                input = document.createElement('select');

                // Add empty option
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '-- None --';
                if (!value) emptyOption.selected = true;
                input.appendChild(emptyOption);

                // Add all items from game data
                this.editor.data.sceneItems.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.name;
                    option.textContent = `${item.longName || item.name} (${item.name})`;
                    if (value === item.name) option.selected = true;
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

            case 'image':
                // Create a container for input and preview
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-field-container';

                input = document.createElement('input');
                input.type = 'text';
                input.name = fieldName;
                input.id = `field-${fieldName}`;
                input.value = value || '';
                input.placeholder = 'e.g., item-name.png';
                imageContainer.appendChild(input);

                // Create preview element
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                if (value) {
                    const img = document.createElement('img');
                    // Determine path based on field name
                    const imagePath = fieldName === 'backgroundImage'
                        ? `../src/assets/images/backgrounds/${value}`
                        : `../src/assets/images/items/${value}`;
                    img.src = imagePath;
                    img.alt = 'Preview';
                    img.onerror = () => {
                        preview.innerHTML = '<span class="preview-error">Image not found</span>';
                    };
                    preview.appendChild(img);
                } else {
                    preview.innerHTML = '<span class="preview-placeholder">No image</span>';
                }
                imageContainer.appendChild(preview);

                // Update preview when input changes
                input.addEventListener('input', (e) => {
                    const newValue = e.target.value.trim();
                    preview.innerHTML = '';

                    if (newValue) {
                        const img = document.createElement('img');
                        const imagePath = fieldName === 'backgroundImage'
                            ? `../src/assets/images/backgrounds/${newValue}`
                            : `../src/assets/images/items/${newValue}`;
                        img.src = imagePath;
                        img.alt = 'Preview';
                        img.onerror = () => {
                            preview.innerHTML = '<span class="preview-error">Image not found</span>';
                        };
                        preview.appendChild(img);
                    } else {
                        preview.innerHTML = '<span class="preview-placeholder">No image</span>';
                    }
                });

                // Append the container instead of just the input
                formGroup.appendChild(imageContainer);

                if (fieldDef.help) {
                    const help = document.createElement('div');
                    help.className = 'form-help';
                    help.textContent = fieldDef.help;
                    formGroup.appendChild(help);
                }

                return formGroup;

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

