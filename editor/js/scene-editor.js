/**
 * Scene Editor - Handles scene editing UI and logic
 */

import { sceneSchema, validateObject } from './schema.js';

export class SceneEditor {
    constructor(editor) {
        this.editor = editor;
        this.currentScene = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Delete button
        document.getElementById('delete-scene-btn').addEventListener('click', () => {
            if (this.currentScene) {
                this.delete(this.currentScene);
            }
        });
        
        // Duplicate button
        document.getElementById('duplicate-scene-btn').addEventListener('click', () => {
            if (this.currentScene) {
                this.duplicate(this.currentScene);
            }
        });
    }
    
    /**
     * Create a new scene
     */
    createNew() {
        const newScene = {
            sceneName: `scene${this.editor.data.scenes.length + 1}`,
            title: "New Scene",
            textOne: "Scene description goes here.",
            stage: `Stage ${this.editor.data.scenes.length + 1}`,
            stageNumber: this.editor.data.scenes.length + 1,
            sceneType: "scene",
            sceneMusic: "",
            backgroundImage: "",
            items: []
        };
        
        this.editor.addScene(newScene);
        this.edit(newScene.sceneName);
        this.editor.uiManager.setStatus('New scene created', 'success');
    }
    
    /**
     * Edit an existing scene
     */
    edit(sceneName) {
        const scene = this.editor.getSceneByName(sceneName);
        if (!scene) return;
        
        this.currentScene = sceneName;
        this.renderForm(scene);
        this.editor.uiManager.showPanel('scene-editor');
        
        // Update title
        document.getElementById('scene-editor-title').textContent = `Edit Scene: ${scene.title}`;
    }
    
    /**
     * Render the scene editing form
     */
    renderForm(scene) {
        const form = document.getElementById('scene-form');
        form.innerHTML = '';
        
        // Basic Information Section
        const basicSection = this.createSection('Basic Information');
        basicSection.appendChild(this.editor.uiManager.createFormField('sceneName', sceneSchema.sceneName, scene.sceneName, scene));
        basicSection.appendChild(this.editor.uiManager.createFormField('title', sceneSchema.title, scene.title, scene));
        basicSection.appendChild(this.editor.uiManager.createFormField('textOne', sceneSchema.textOne, scene.textOne, scene));
        
        const stageRow = document.createElement('div');
        stageRow.className = 'form-row';
        stageRow.appendChild(this.editor.uiManager.createFormField('stage', sceneSchema.stage, scene.stage, scene));
        stageRow.appendChild(this.editor.uiManager.createFormField('stageNumber', sceneSchema.stageNumber, scene.stageNumber, scene));
        basicSection.appendChild(stageRow);
        
        basicSection.appendChild(this.editor.uiManager.createFormField('sceneType', sceneSchema.sceneType, scene.sceneType, scene));
        form.appendChild(basicSection);
        
        // Assets Section
        const assetsSection = this.createSection('Assets');
        assetsSection.appendChild(this.editor.uiManager.createFormField('backgroundImage', sceneSchema.backgroundImage, scene.backgroundImage, scene));
        assetsSection.appendChild(this.editor.uiManager.createFormField('sceneMusic', sceneSchema.sceneMusic, scene.sceneMusic, scene));
        form.appendChild(assetsSection);
        
        // Items Section
        const itemsSection = this.createSection('Items in Scene');
        const itemsField = this.createItemsMultiSelect(scene.items || []);
        itemsSection.appendChild(itemsField);
        form.appendChild(itemsSection);
        
        // Lock Settings Section
        const lockSection = this.createSection('Lock Settings');
        lockSection.appendChild(this.editor.uiManager.createFormField('locked', sceneSchema.locked, scene.locked, scene));
        
        const unlockedByField = this.editor.uiManager.createFormField('unlockedBy', sceneSchema.unlockedBy, scene.unlockedBy, scene);
        if (unlockedByField) {
            lockSection.appendChild(unlockedByField);
        }
        form.appendChild(lockSection);
        
        // Puzzle Settings Section (conditional)
        if (scene.sceneType === 'puzzle') {
            const puzzleSection = this.createSection('Puzzle Settings');
            puzzleSection.appendChild(this.editor.uiManager.createFormField('puzzleModule', sceneSchema.puzzleModule, scene.puzzleModule, scene));
            
            const puzzleConfigField = document.createElement('div');
            puzzleConfigField.className = 'form-group';
            puzzleConfigField.innerHTML = `
                <label>Puzzle Configuration</label>
                <textarea name="puzzleConfig" id="field-puzzleConfig" rows="10">${scene.puzzleConfig ? JSON.stringify(scene.puzzleConfig, null, 2) : '{}'}</textarea>
                <div class="form-help">JSON configuration for the puzzle</div>
            `;
            puzzleSection.appendChild(puzzleConfigField);
            form.appendChild(puzzleSection);
        }
        
        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary btn-large';
        saveBtn.textContent = '💾 Save Scene';
        saveBtn.addEventListener('click', () => this.save());
        form.appendChild(saveBtn);
        
        // Add change listener for sceneType to re-render form
        const sceneTypeSelect = form.querySelector('[name="sceneType"]');
        if (sceneTypeSelect) {
            sceneTypeSelect.addEventListener('change', () => {
                const formData = this.getFormData();
                this.renderForm(formData);
            });
        }
        
        // Add change listener for locked checkbox
        const lockedCheckbox = form.querySelector('[name="locked"]');
        if (lockedCheckbox) {
            lockedCheckbox.addEventListener('change', () => {
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
     * Create items multi-select field
     */
    createItemsMultiSelect(selectedItems) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        const label = document.createElement('label');
        label.textContent = 'Items in Scene';
        formGroup.appendChild(label);
        
        const container = document.createElement('div');
        container.style.maxHeight = '200px';
        container.style.overflowY = 'auto';
        container.style.border = '1px solid var(--editor-border)';
        container.style.borderRadius = '4px';
        container.style.padding = 'var(--spacing-sm)';
        
        this.editor.data.sceneItems.forEach(item => {
            const checkboxWrapper = document.createElement('div');
            checkboxWrapper.style.marginBottom = 'var(--spacing-xs)';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `item-${item.name}`;
            checkbox.value = item.name;
            checkbox.checked = selectedItems.includes(item.name);
            checkbox.dataset.itemCheckbox = 'true';
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.htmlFor = `item-${item.name}`;
            checkboxLabel.textContent = ` ${item.longName || item.name}`;
            checkboxLabel.style.marginLeft = 'var(--spacing-xs)';
            checkboxLabel.style.cursor = 'pointer';
            
            checkboxWrapper.appendChild(checkbox);
            checkboxWrapper.appendChild(checkboxLabel);
            container.appendChild(checkboxWrapper);
        });
        
        formGroup.appendChild(container);
        
        const help = document.createElement('div');
        help.className = 'form-help';
        help.textContent = 'Select which items appear in this scene';
        formGroup.appendChild(help);
        
        return formGroup;
    }
    
    /**
     * Get form data
     */
    getFormData() {
        const form = document.getElementById('scene-form');
        const formData = {};
        
        // Get all input values
        form.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.dataset.itemCheckbox) return; // Skip item checkboxes for now
            
            const name = input.name;
            if (!name) return;
            
            if (input.type === 'checkbox') {
                formData[name] = input.checked;
            } else if (input.type === 'number') {
                formData[name] = input.value ? Number(input.value) : null;
            } else {
                formData[name] = input.value;
            }
        });
        
        // Get selected items
        const selectedItems = [];
        form.querySelectorAll('[data-item-checkbox]:checked').forEach(checkbox => {
            selectedItems.push(checkbox.value);
        });
        formData.items = selectedItems;
        
        // Parse puzzleConfig if present
        if (formData.puzzleConfig) {
            try {
                formData.puzzleConfig = JSON.parse(formData.puzzleConfig);
            } catch (e) {
                console.error('Invalid puzzle config JSON');
            }
        }
        
        return formData;
    }
    
    /**
     * Save scene
     */
    save() {
        const formData = this.getFormData();
        
        // Validate
        const errors = validateObject(formData, sceneSchema);
        if (errors) {
            console.error('Validation errors:', errors);
            this.editor.uiManager.setStatus('Please fix validation errors', 'danger');
            return;
        }
        
        // Update or add
        this.editor.updateScene(this.currentScene, formData);
        this.currentScene = formData.sceneName;
        this.editor.uiManager.setStatus('Scene saved successfully', 'success');
    }
    
    /**
     * Delete scene
     */
    delete(sceneName) {
        this.editor.uiManager.showModal(
            'Delete Scene',
            `Are you sure you want to delete "${sceneName}"? This cannot be undone.`,
            () => {
                this.editor.deleteScene(sceneName);
                this.editor.uiManager.setStatus('Scene deleted', 'success');
            }
        );
    }
    
    /**
     * Duplicate scene
     */
    duplicate(sceneName) {
        const scene = this.editor.getSceneByName(sceneName);
        if (!scene) return;
        
        const newScene = { ...scene };
        newScene.sceneName = `${scene.sceneName}_copy`;
        newScene.title = `${scene.title} (Copy)`;
        
        this.editor.addScene(newScene);
        this.edit(newScene.sceneName);
        this.editor.uiManager.setStatus('Scene duplicated', 'success');
    }
}

