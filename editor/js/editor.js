/**
 * Game Data Editor - Main Application
 */

import { sceneSchema, itemSchema, animationSchema, styleSchema, validateObject } from './schema.js';
import { SceneEditor } from './scene-editor.js';
import { ItemEditor } from './item-editor.js';
import { DataManager } from './data-manager.js';
import { UIManager } from './ui-manager.js';
import { StorageManager } from './storage-manager.js';
import { ProjectManager } from './project-manager.js';
import { CodeEditor } from './code-editor.js';
import { AudioEditor } from './audio-editor.js';
import { AssetsManager } from './assets-manager.js';
import { SceneComposer } from './scene-composer.js';
import { PropertiesPanel } from './properties-panel.js';
import { ScenePropertiesPanel } from './scene-properties-panel.js';
import { LayersPanel } from './layers-panel.js';
import { FlowsVisualizer } from './flows-visualizer.js';

class GameDataEditor {
    constructor() {
        this.data = {
            title: "Adventure Game",
            version: "2.0.0",
            scenes: [],
            sceneItems: []
        };

        this.currentTab = 'scenes';
        this.selectedScene = null;
        this.selectedItem = null;

        // Initialize managers
        this.dataManager = new DataManager(this);
        this.uiManager = new UIManager(this);
        this.sceneEditor = new SceneEditor(this);
        this.itemEditor = new ItemEditor(this);
        this.audioEditor = new AudioEditor(this);
        this.assetsManager = new AssetsManager(this);
        this.sceneComposer = new SceneComposer(this);
        this.propertiesPanel = new PropertiesPanel(this);
        this.scenePropertiesPanel = new ScenePropertiesPanel(this);
        this.layersPanel = new LayersPanel(this);
        this.flowsVisualizer = new FlowsVisualizer(this);
        this.storageManager = new StorageManager();
        this.projectManager = new ProjectManager(this, this.storageManager);
        this.codeEditor = new CodeEditor(this);

        // Make project manager globally accessible for inline onclick handlers
        window.projectManager = this.projectManager;

        this.init();
    }

    async init() {
        console.log('🎮 Game Data Editor initialized');

        // Initialize IndexedDB
        try {
            await this.storageManager.init();
            console.log('✓ IndexedDB ready');

            // Try to restore last opened project
            await this.restoreLastSession();
        } catch (error) {
            console.error('IndexedDB initialization failed:', error);
            this.uiManager.setStatus('Warning: Project storage unavailable', 'warning');
        }

        this.setupEventListeners();
        this.uiManager.updateCounts();
    }

    /**
     * Restore last opened project from previous session
     */
    async restoreLastSession() {
        const lastProjectId = this.storageManager.getLastOpenedProject();

        if (!lastProjectId) {
            console.log('No previous session to restore');
            return;
        }

        try {
            console.log('🔄 Restoring last session...');
            this.uiManager.setStatus('Restoring last session...', 'info');

            // Check if project still exists
            const project = await this.storageManager.loadProject(lastProjectId);

            if (project) {
                console.log('✓ Restoring project:', project.name);
                this.loadData(project.gameData);
                this.projectManager.updateProjectTitle(project.name);
                this.projectManager.startAutoSave();
                this.uiManager.setStatus(`Restored: ${project.name}`, 'success');
            }
        } catch (error) {
            console.warn('Failed to restore last session:', error);
            // Clear invalid last project reference
            this.storageManager.clearLastOpenedProject();
            this.uiManager.setStatus('Could not restore last session', 'warning');
        }
    }
    
    setupEventListeners() {
        // Tab navigation (left sidebar)
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Preview tab navigation (right sidebar)
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPreviewTab(e.target.dataset.previewTab);
            });
        });

        // Dropdown menu
        const menuBtn = document.getElementById('menu-btn');
        const menuDropdown = document.getElementById('menu-dropdown');

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
                menuDropdown.classList.remove('show');
            }
        });

        // Close dropdown when clicking a menu item
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                menuDropdown.classList.remove('show');
            });
        });

        // Toggle Flows
        document.getElementById('toggle-flows-btn').addEventListener('click', () => {
            this.toggleFlows();
        });

        // Toggle Composer
        document.getElementById('toggle-composer-btn').addEventListener('click', () => {
            this.toggleComposer();
        });

        // Toggle Code View
        document.getElementById('toggle-code-btn').addEventListener('click', () => {
            this.toggleCodeView();
        });

        // Import/Export
        document.getElementById('import-btn').addEventListener('click', () => {
            this.dataManager.importData();
        });
        
        document.getElementById('export-btn').addEventListener('click', () => {
            this.dataManager.exportData();
        });
        
        document.getElementById('welcome-import-btn').addEventListener('click', () => {
            this.dataManager.importData();
        });
        
        document.getElementById('welcome-new-btn').addEventListener('click', () => {
            this.uiManager.hideWelcome();
        });
        
        // Add buttons
        document.getElementById('add-scene-btn').addEventListener('click', () => {
            this.sceneEditor.createNew();
        });
        
        document.getElementById('add-item-btn').addEventListener('click', () => {
            this.itemEditor.createNew();
        });
        
        // Search
        document.getElementById('scene-search').addEventListener('input', (e) => {
            this.uiManager.filterScenes(e.target.value);
        });
        
        document.getElementById('item-search').addEventListener('input', (e) => {
            this.uiManager.filterItems(e.target.value);
        });
        
        document.getElementById('item-type-filter').addEventListener('change', (e) => {
            this.uiManager.filterItems(document.getElementById('item-search').value, e.target.value);
        });
        
        // Modal
        document.getElementById('modal-close').addEventListener('click', () => {
            this.uiManager.hideModal();
        });
        
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.uiManager.hideModal();
        });
        
        // File input
        document.getElementById('file-input').addEventListener('change', (e) => {
            this.dataManager.handleFileSelect(e);
        });
    }
    
    switchTab(tabName) {
        // Auto-save current work before switching
        this.saveCurrentWork();

        this.currentTab = tabName;

        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'scenes') {
            document.getElementById('scenes-list').classList.add('active');
            // Load first scene if available
            if (this.data && this.data.scenes.length > 0) {
                const firstScene = this.data.scenes[0];
                this.uiManager.selectScene(firstScene.sceneName);
            }
        } else if (tabName === 'items') {
            document.getElementById('items-list').classList.add('active');
            // Load first item if available
            if (this.data && this.data.sceneItems.length > 0) {
                const firstItem = this.data.sceneItems[0];
                this.uiManager.selectItem(firstItem.name);
            }
        } else if (tabName === 'audio') {
            document.getElementById('audio-list').classList.add('active');
            this.audioEditor.show();
        }
    }

    /**
     * Switch preview tab (right sidebar)
     */
    switchPreviewTab(tabName) {
        // Auto-save current work before switching
        this.saveCurrentWork();

        // Update preview tabs
        document.querySelectorAll('.preview-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.previewTab === tabName);
        });

        // Update preview tab content
        document.querySelectorAll('.preview-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'properties') {
            document.getElementById('properties-content').classList.add('active');
        } else if (tabName === 'scene') {
            document.getElementById('scene-tab-content').classList.add('active');
        } else if (tabName === 'layers') {
            document.getElementById('layers-tab-content').classList.add('active');
        } else if (tabName === 'settings') {
            document.getElementById('settings-tab-content').classList.add('active');
        } else if (tabName === 'assets') {
            document.getElementById('assets-tab-content').classList.add('active');
            // Reload assets when tab is shown
            this.assetsManager.loadAssets();
        }
    }

    /**
     * Toggle flows visualizer on/off
     */
    toggleFlows() {
        const flows = document.getElementById('flows-container');
        const toggleBtn = document.getElementById('toggle-flows-btn');

        if (flows.classList.contains('active')) {
            // Hide flows
            this.saveCurrentWork();
            this.flowsVisualizer.hide();
            toggleBtn.classList.remove('active');
        } else {
            // Show flows
            this.saveCurrentWork();
            this.uiManager.showPanel('flows-container');
            toggleBtn.classList.add('active');
            this.flowsVisualizer.show();
        }
    }

    /**
     * Toggle composer view on/off
     */
    toggleComposer() {
        const composer = document.getElementById('composer-container');
        const toggleBtn = document.getElementById('toggle-composer-btn');

        if (composer.classList.contains('active')) {
            // Hide composer
            this.saveCurrentWork();

            // Get the current scene from composer before hiding
            const currentSceneName = this.sceneComposer.currentScene?.sceneName;

            this.sceneComposer.hide();
            toggleBtn.classList.remove('active');

            // Hide Layers tab, show Settings and Assets tabs
            this.updateTabsForComposerMode(false);

            // Load the scene into the scene editor
            if (currentSceneName) {
                this.sceneEditor.edit(currentSceneName);
            }
        } else {
            // Show composer
            this.saveCurrentWork();
            this.uiManager.showPanel('composer-container');
            toggleBtn.classList.add('active');
            this.sceneComposer.show();

            // Show Layers tab, hide Settings and Assets tabs
            this.updateTabsForComposerMode(true);
        }
    }

    /**
     * Update visible tabs based on composer mode
     */
    updateTabsForComposerMode(isComposerMode) {
        const sceneTab = document.querySelector('[data-preview-tab="scene"]');
        const layersTab = document.querySelector('[data-preview-tab="layers"]');
        const settingsTab = document.querySelector('[data-preview-tab="settings"]');
        const assetsTab = document.querySelector('[data-preview-tab="assets"]');
        const sceneContent = document.getElementById('scene-tab-content');
        const layersContent = document.getElementById('layers-tab-content');

        if (isComposerMode) {
            // Show Scene and Layers, hide Settings and Assets
            sceneTab.style.display = '';
            layersTab.style.display = '';
            settingsTab.style.display = 'none';
            assetsTab.style.display = 'none';
            sceneContent.style.display = '';
            layersContent.style.display = '';

            // Switch to Properties tab if on Settings or Assets
            const activeTab = document.querySelector('.preview-tab.active');
            if (activeTab && (activeTab.dataset.previewTab === 'settings' || activeTab.dataset.previewTab === 'assets')) {
                this.switchPreviewTab('properties');
            }
        } else {
            // Hide Scene and Layers, show Settings and Assets
            sceneTab.style.display = 'none';
            layersTab.style.display = 'none';
            settingsTab.style.display = '';
            assetsTab.style.display = '';
            sceneContent.style.display = 'none';
            layersContent.style.display = 'none';

            // Switch to Properties tab if on Scene or Layers
            const activeTab = document.querySelector('.preview-tab.active');
            if (activeTab && (activeTab.dataset.previewTab === 'scene' || activeTab.dataset.previewTab === 'layers')) {
                this.switchPreviewTab('properties');
            }
        }
    }

    /**
     * Toggle code view on/off
     */
    toggleCodeView() {
        const codeEditor = document.getElementById('code-editor');
        const toggleBtn = document.getElementById('toggle-code-btn');

        if (codeEditor.classList.contains('active')) {
            // Hide code editor
            this.saveCurrentWork();
            codeEditor.classList.remove('active');
            toggleBtn.classList.remove('active');
        } else {
            // Show code editor
            this.saveCurrentWork();
            this.uiManager.showPanel('code-editor');
            toggleBtn.classList.add('active');
            this.codeEditor.show();
        }
    }

    /**
     * Save current work (scene, item, audio, or code) if any is being edited
     */
    saveCurrentWork() {
        // Check if composer is active
        // Note: Composer changes are already saved directly to the data model
        // when dragging/resizing items, so no explicit save needed here
        const composer = document.getElementById('composer-container');
        if (composer && composer.classList.contains('active')) {
            // Composer edits are auto-saved in real-time
            console.log('Composer changes already saved to data model');
        }

        // Check if scene editor is active
        const sceneEditor = document.getElementById('scene-editor');
        if (sceneEditor && sceneEditor.classList.contains('active')) {
            this.sceneEditor.saveIfValid();
        }

        // Check if item editor is active
        const itemEditor = document.getElementById('item-editor');
        if (itemEditor && itemEditor.classList.contains('active')) {
            this.itemEditor.saveIfValid();
        }

        // Check if audio editor is active
        const audioEditor = document.getElementById('audio-editor');
        if (audioEditor && audioEditor.classList.contains('active')) {
            this.audioEditor.saveIfValid();
        }

        // Check if code editor is active (in main content area)
        const codeEditor = document.getElementById('code-editor');
        if (codeEditor && codeEditor.classList.contains('active')) {
            this.codeEditor.saveIfValid();
        }
    }
    
    loadData(data) {
        this.data = data;
        this.uiManager.hideWelcome();
        this.uiManager.renderSceneList();
        this.uiManager.renderItemList();
        this.uiManager.updateCounts();
        this.uiManager.setStatus('Data loaded successfully', 'success');
    }
    
    getSceneByName(sceneName) {
        return this.data.scenes.find(s => s.sceneName === sceneName);
    }
    
    getItemByName(itemName) {
        return this.data.sceneItems.find(i => i.name === itemName);
    }
    
    addScene(scene) {
        this.data.scenes.push(scene);
        this.uiManager.renderSceneList();
        this.uiManager.updateCounts();
    }
    
    updateScene(sceneName, updatedScene) {
        const index = this.data.scenes.findIndex(s => s.sceneName === sceneName);
        if (index !== -1) {
            this.data.scenes[index] = updatedScene;
            this.uiManager.renderSceneList();
        }
    }
    
    deleteScene(sceneName) {
        this.data.scenes = this.data.scenes.filter(s => s.sceneName !== sceneName);
        this.uiManager.renderSceneList();
        this.uiManager.updateCounts();
        this.uiManager.hidePanel('scene-editor');
    }
    
    addItem(item) {
        this.data.sceneItems.push(item);
        this.uiManager.renderItemList();
        this.uiManager.updateCounts();
    }
    
    updateItem(itemName, updatedItem) {
        const index = this.data.sceneItems.findIndex(i => i.name === itemName);
        if (index !== -1) {
            // Merge with existing item to preserve fields not in the form
            const existingItem = this.data.sceneItems[index];
            this.data.sceneItems[index] = { ...existingItem, ...updatedItem };
            this.uiManager.renderItemList();
        }
    }
    
    deleteItem(itemName) {
        this.data.sceneItems = this.data.sceneItems.filter(i => i.name !== itemName);
        
        // Remove from all scenes
        this.data.scenes.forEach(scene => {
            if (scene.items) {
                scene.items = scene.items.filter(i => i !== itemName);
            }
        });
        
        this.uiManager.renderItemList();
        this.uiManager.renderSceneList();
        this.uiManager.updateCounts();
        this.uiManager.hidePanel('item-editor');
    }
}

// Initialize editor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameDataEditor = new GameDataEditor();
});

