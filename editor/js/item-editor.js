/**
 * Item Editor - Handles item editing UI and logic
 */

import { itemSchema, animationSchema, styleSchema, validateObject, ITEM_TYPES } from './schema.js';

export class ItemEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentItem = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Delete button
        document.getElementById('delete-item-btn').addEventListener('click', () => {
            if (this.currentItem) {
                this.delete(this.currentItem);
            }
        });
        
        // Duplicate button
        document.getElementById('duplicate-item-btn').addEventListener('click', () => {
            if (this.currentItem) {
                this.duplicate(this.currentItem);
            }
        });
    }
    
    /**
     * Create a new item
     */
    createNew() {
        const newItem = {
            name: `item${this.editor.data.sceneItems.length + 1}`,
            longName: "New Item",
            shortName: "",
            type: "item",
            lookAt: "An interesting item.",
            pickUpMessage: "You pick up the item.",
            useWith: "",
            useMessage: "",
            useResult: "",
            outcome: "keep",
            points: 0,
            image: "",
            position: [100, 100],
            size: [50, 50]
        };
        
        this.editor.addItem(newItem);
        this.edit(newItem.name);
        this.editor.uiManager.setStatus('New item created', 'success');
    }
    
    /**
     * Edit an existing item
     */
    edit(itemName) {
        const item = this.editor.getItemByName(itemName);
        if (!item) return;
        
        this.currentItem = itemName;
        this.renderForm(item);
        this.editor.uiManager.showPanel('item-editor');
        
        // Update title
        document.getElementById('item-editor-title').textContent = `Edit Item: ${item.longName || item.name}`;
    }
    
    /**
     * Render the item editing form
     */
    renderForm(item) {
        const form = document.getElementById('item-form');
        form.innerHTML = '';

        // Basic Information Section
        const basicSection = this.createSection('Basic Information');
        basicSection.appendChild(this.editor.uiManager.createFormField('name', itemSchema.name, item.name, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('longName', itemSchema.longName, item.longName, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('shortName', itemSchema.shortName, item.shortName, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('type', itemSchema.type, item.type, item));
        basicSection.appendChild(this.editor.uiManager.createFormField('lookAt', itemSchema.lookAt, item.lookAt, item));
        form.appendChild(basicSection);
        
        // Interaction Section
        const interactionSection = this.createSection('Interaction');
        
        // Conditional fields based on type
        const pickUpField = this.editor.uiManager.createFormField('pickUpMessage', itemSchema.pickUpMessage, item.pickUpMessage, item);
        if (pickUpField) interactionSection.appendChild(pickUpField);
        
        interactionSection.appendChild(this.editor.uiManager.createFormField('useWith', itemSchema.useWith, item.useWith, item));
        interactionSection.appendChild(this.editor.uiManager.createFormField('useMessage', itemSchema.useMessage, item.useMessage, item));
        interactionSection.appendChild(this.editor.uiManager.createFormField('useResult', itemSchema.useResult, item.useResult, item));
        interactionSection.appendChild(this.editor.uiManager.createFormField('outcome', itemSchema.outcome, item.outcome, item));
        
        const linkField = this.editor.uiManager.createFormField('linkToScene', itemSchema.linkToScene, item.linkToScene, item);
        if (linkField) interactionSection.appendChild(linkField);
        
        const nextSceneField = this.editor.uiManager.createFormField('nextScene', itemSchema.nextScene, item.nextScene, item);
        if (nextSceneField) interactionSection.appendChild(nextSceneField);
        
        const lockedMsgField = this.editor.uiManager.createFormField('lockedMessage', itemSchema.lockedMessage, item.lockedMessage, item);
        if (lockedMsgField) interactionSection.appendChild(lockedMsgField);
        
        interactionSection.appendChild(this.editor.uiManager.createFormField('points', itemSchema.points, item.points, item));
        form.appendChild(interactionSection);
        
        // Visual Section
        const visualSection = this.createSection('Visual Properties');
        visualSection.appendChild(this.editor.uiManager.createFormField('image', itemSchema.image, item.image, item));
        
        // Position and Size
        const positionField = this.createPositionField(item.position || [0, 0]);
        visualSection.appendChild(positionField);
        
        const sizeField = this.createSizeField(item.size || [50, 50]);
        visualSection.appendChild(sizeField);
        
        const hitRow = document.createElement('div');
        hitRow.className = 'form-row';
        hitRow.appendChild(this.editor.uiManager.createFormField('hitW', itemSchema.hitW, item.hitW, item));
        hitRow.appendChild(this.editor.uiManager.createFormField('hitH', itemSchema.hitH, item.hitH, item));
        visualSection.appendChild(hitRow);
        
        form.appendChild(visualSection);
        
        // Animation Section
        const animationSection = this.createSection('Animation (Optional)');
        const animationField = this.createAnimationField(item.animation);
        animationSection.appendChild(animationField);
        form.appendChild(animationSection);
        
        // Effects Section
        const effectsSection = this.createSection('Effects');
        effectsSection.appendChild(this.editor.uiManager.createFormField('onClickEffect', itemSchema.onClickEffect, item.onClickEffect, item));
        effectsSection.appendChild(this.editor.uiManager.createFormField('onClickSound', itemSchema.onClickSound, item.onClickSound, item));
        form.appendChild(effectsSection);
        
        // Style Section
        const styleSection = this.createSection('Style');
        const styleField = this.createStyleField(item.style);
        styleSection.appendChild(styleField);
        form.appendChild(styleSection);

        // Add change listener for type to re-render form
        const typeSelect = form.querySelector('[name="type"]');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                const formData = this.getFormData();
                this.renderForm(formData);
            });
        }
        
        // Add change listener for outcome to re-render form
        const outcomeSelect = form.querySelector('[name="outcome"]');
        if (outcomeSelect) {
            outcomeSelect.addEventListener('change', () => {
                const formData = this.getFormData();
                this.renderForm(formData);
            });
        }
    }
    
    /**
     * Create a form section
     */
    createSection(title) {
        const section = document.createElement('div');
        section.className = 'form-section';
        
        const titleEl = document.createElement('h3');
        titleEl.className = 'form-section-title';
        titleEl.textContent = title;
        section.appendChild(titleEl);
        
        return section;
    }
    
    /**
     * Create position field [X, Y]
     */
    createPositionField(position) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Position [X, Y]';
        formGroup.appendChild(label);
        
        const row = document.createElement('div');
        row.className = 'form-row';
        
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.name = 'position-x';
        xInput.value = position[0];
        xInput.placeholder = 'X';
        
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.name = 'position-y';
        yInput.value = position[1];
        yInput.placeholder = 'Y';
        
        row.appendChild(xInput);
        row.appendChild(yInput);
        formGroup.appendChild(row);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Position on scene canvas (pixels from top-left)';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Create size field [W, H]
     */
    createSizeField(size) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Size [W, H]';
        formGroup.appendChild(label);
        
        const row = document.createElement('div');
        row.className = 'form-row';
        
        const wInput = document.createElement('input');
        wInput.type = 'number';
        wInput.name = 'size-w';
        wInput.value = size[0];
        wInput.placeholder = 'Width';
        
        const hInput = document.createElement('input');
        hInput.type = 'number';
        hInput.name = 'size-h';
        hInput.value = size[1];
        hInput.placeholder = 'Height';
        
        row.appendChild(wInput);
        row.appendChild(hInput);
        formGroup.appendChild(row);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Width and height in pixels';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Create animation field
     */
    createAnimationField(animation) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Animation Configuration';
        formGroup.appendChild(label);
        
        const textarea = document.createElement('textarea');
        textarea.name = 'animation';
        textarea.rows = 8;
        textarea.value = animation ? JSON.stringify(animation, null, 2) : '';
        textarea.placeholder = 'Leave empty for no animation, or enter JSON:\n{\n  "type": "bob",\n  "speed": 1,\n  "amplitude": 10\n}';
        formGroup.appendChild(textarea);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'JSON configuration for animation (bob, pulse, spin, fade, sprite)';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Create style field
     */
    createStyleField(style) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Style Configuration';
        formGroup.appendChild(label);
        
        const textarea = document.createElement('textarea');
        textarea.name = 'style';
        textarea.rows = 4;
        textarea.value = style ? JSON.stringify(style, null, 2) : '';
        textarea.placeholder = 'Leave empty or enter JSON:\n{\n  "className": "item--custom",\n  "hoverEffect": "glow"\n}';
        formGroup.appendChild(textarea);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'CSS class and hover effect (glow, pulse, shine, swing)';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Get form data
     */
    getFormData() {
        const form = document.getElementById('item-form');
        const formData = {};
        
        // Get all input values
        form.querySelectorAll('input, select, textarea').forEach(input => {
            const name = input.name;
            if (!name) return;
            
            // Handle special fields
            if (name === 'position-x' || name === 'position-y' || 
                name === 'size-w' || name === 'size-h') {
                return; // Handle separately
            }
            
            if (input.type === 'checkbox') {
                formData[name] = input.checked;
            } else if (input.type === 'number') {
                formData[name] = input.value ? Number(input.value) : null;
            } else {
                formData[name] = input.value || null;
            }
        });
        
        // Handle position
        const posX = form.querySelector('[name="position-x"]');
        const posY = form.querySelector('[name="position-y"]');
        if (posX && posY) {
            formData.position = [Number(posX.value) || 0, Number(posY.value) || 0];
        }
        
        // Handle size
        const sizeW = form.querySelector('[name="size-w"]');
        const sizeH = form.querySelector('[name="size-h"]');
        if (sizeW && sizeH) {
            formData.size = [Number(sizeW.value) || 50, Number(sizeH.value) || 50];
        }
        
        // Parse JSON fields
        if (formData.animation) {
            try {
                formData.animation = formData.animation.trim() ? JSON.parse(formData.animation) : null;
            } catch (e) {
                console.error('Invalid animation JSON');
                formData.animation = null;
            }
        }
        
        if (formData.style) {
            try {
                formData.style = formData.style.trim() ? JSON.parse(formData.style) : null;
            } catch (e) {
                console.error('Invalid style JSON');
                formData.style = null;
            }
        }
        
        return formData;
    }
    
    /**
     * Save item
     */
    save() {
        const formData = this.getFormData();

        // Basic validation
        if (!formData.name || !formData.longName || !formData.type) {
            this.editor.uiManager.setStatus('Please fill in required fields', 'danger');
            return false;
        }

        // Update or add
        this.editor.updateItem(this.currentItem, formData);
        this.currentItem = formData.name;
        this.editor.uiManager.setStatus('Item saved successfully', 'success');
        return true;
    }

    /**
     * Save item if valid (for auto-save)
     */
    saveIfValid() {
        if (!this.currentItem) return;

        const formData = this.getFormData();

        // Basic validation
        if (!formData.name || !formData.longName || !formData.type) {
            // Don't show error for auto-save, just skip
            console.log('Auto-save skipped: validation errors');
            return;
        }

        // Update or add
        this.editor.updateItem(this.currentItem, formData);
        this.currentItem = formData.name;
        console.log('Item auto-saved');

        // Show subtle feedback
        this.showAutoSaveFeedback();
    }

    /**
     * Show auto-save feedback
     */
    showAutoSaveFeedback() {
        const indicator = document.getElementById('autosave-indicator');
        if (indicator) {
            indicator.textContent = '✓ Item saved';
            indicator.style.opacity = '1';
            setTimeout(() => {
                indicator.style.opacity = '0';
            }, 1500);
        }
    }
    
    /**
     * Delete item
     */
    delete(itemName) {
        this.editor.uiManager.showModal(
            'Delete Item',
            `Are you sure you want to delete "${itemName}"? This will also remove it from all scenes. This cannot be undone.`,
            () => {
                this.editor.deleteItem(itemName);
                this.editor.uiManager.setStatus('Item deleted', 'success');
            }
        );
    }
    
    /**
     * Duplicate item
     */
    duplicate(itemName) {
        const item = this.editor.getItemByName(itemName);
        if (!item) return;
        
        const newItem = { ...item };
        newItem.name = `${item.name}_copy`;
        newItem.longName = `${item.longName} (Copy)`;
        
        this.editor.addItem(newItem);
        this.edit(newItem.name);
        this.editor.uiManager.setStatus('Item duplicated', 'success');
    }
}

