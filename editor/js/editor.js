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
        } catch (error) {
            console.error('IndexedDB initialization failed:', error);
            this.uiManager.setStatus('Warning: Project storage unavailable', 'warning');
        }

        this.setupEventListeners();
        this.uiManager.updateCounts();
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
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
        } else if (tabName === 'items') {
            document.getElementById('items-list').classList.add('active');
        } else if (tabName === 'code') {
            document.getElementById('code-list').classList.add('active');
            this.uiManager.showPanel('code-editor');
        } else if (tabName === 'settings') {
            document.getElementById('settings-panel').classList.add('active');
        }
    }

    /**
     * Save current work (scene, item, or code) if any is being edited
     */
    saveCurrentWork() {
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

        // Check if code editor is active
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
            this.data.sceneItems[index] = updatedItem;
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

