/**
 * Achievement Manager
 * Handles achievement tracking, journal entries, and achievement notifications
 */

import { EventEmitter } from './EventEmitter.js'

export class AchievementManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.journal = [] // Array of journal entries: { id, text, points, timestamp, type }
    }

    /**
     * Add achievement to journal
     * @param {string} achievementId - Unique ID (same as used for scoring)
     * @param {string} text - Achievement text for journal
     * @param {number} points - Points awarded
     * @param {string} type - 'item', 'puzzle', 'scene', 'combine'
     * @returns {boolean} True if achievement was added, false if already exists
     */
    addAchievement(achievementId, text, points = 0, type = 'general') {
        // Check if already exists
        if (this.journal.find(entry => entry.id === achievementId)) {
            console.log(`🏆 Achievement already in journal: ${achievementId}`)
            return false
        }

        const entry = {
            id: achievementId,
            text,
            points,
            type,
            timestamp: Date.now()
        }

        this.journal.push(entry)
        console.log(`🏆 Achievement added to journal: ${achievementId}`, entry)

        // Emit event for listeners
        this.emit('achievementAdded', entry)

        // Show achievement notification modal
        this.showAchievementModal(text, points)

        // Pulse journal button
        this.pulseJournalButton()

        // Check if player has reached winning points
        this.checkWinCondition()

        return true
    }

    /**
     * Check if player has reached the winning points threshold
     */
    checkWinCondition() {
        const totalPoints = this.getTotalPoints()
        const winPoints = this.game.gameConfig?.gameplay?.win || 60

        if (totalPoints >= winPoints) {
            console.log(`🎉 Win condition reached! ${totalPoints} / ${winPoints} points`)
            // Emit gameWon event - Game class will handle showing win screen
            this.game.emit('gameWon', { totalPoints, winPoints })
        }
    }

    /**
     * Show achievement notification modal
     * @param {string} text - Achievement text
     * @param {number} points - Points awarded
     */
    showAchievementModal(text, points) {
        const modal = document.getElementById('achievement-modal')
        if (!modal) {
            console.warn('Achievement modal not found in DOM')
            return
        }

        // Update modal content
        const textElement = modal.querySelector('.achievement-text')
        const pointsElement = modal.querySelector('.achievement-points')
        
        if (textElement) textElement.textContent = text
        if (pointsElement) pointsElement.textContent = points > 0 ? `+${points} points` : ''

        // Show modal with fade-in
        modal.classList.add('active')

        // Auto-hide after 3 seconds
        setTimeout(() => {
            modal.classList.remove('active')
        }, 3000)
    }

    /**
     * Pulse the journal button to indicate new achievement
     */
    pulseJournalButton() {
        const journalBtn = document.getElementById('journal-btn')
        if (!journalBtn) {
            console.warn('Journal button not found in DOM')
            return
        }

        // Add pulse animation class
        journalBtn.classList.add('pulse')

        // Remove class after animation completes
        setTimeout(() => {
            journalBtn.classList.remove('pulse')
        }, 600)
    }

    /**
     * Get all journal entries
     * @returns {Array} Array of journal entries
     */
    getJournal() {
        return [...this.journal]
    }

    /**
     * Set journal entries (used when loading saved game)
     * @param {Array} journal - Array of journal entries
     */
    setJournal(journal) {
        this.journal = journal || []
        console.log(`📖 Journal loaded with ${this.journal.length} entries`)
    }

    /**
     * Clear all journal entries
     */
    clearJournal() {
        this.journal = []
        console.log('📖 Journal cleared')
        this.emit('journalCleared')
    }

    /**
     * Get total points from journal
     * @returns {number} Total points
     */
    getTotalPoints() {
        return this.journal.reduce((total, entry) => total + entry.points, 0)
    }

    /**
     * Check if achievement exists in journal
     * @param {string} achievementId - Achievement ID to check
     * @returns {boolean} True if exists
     */
    hasAchievement(achievementId) {
        return this.journal.some(entry => entry.id === achievementId)
    }
}

