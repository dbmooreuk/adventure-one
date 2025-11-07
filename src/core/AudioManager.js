/**
 * Audio Manager Class
 * Handles all audio operations including music, sound effects, and volume control
 */

import { EventEmitter } from './EventEmitter.js'
import { audio } from '../config/gameConfig.js'

export class AudioManager extends EventEmitter {
    constructor(game) {
        super()
        this.game = game
        this.audioElements = new Map()
        this.currentAmbient = null
        this.isMuted = false
        this.masterVolume = 1.0
        this.musicVolume = audio.defaultVolume
        this.sfxVolume = 0.8
        this.fadeInterval = null
        this.fadeOutDuration = audio.fadeOutDuration
        this.fadeInDuration = audio.fadeInDuration
        this.audioUnlocked = false
        this.pendingAmbient = null // Track ambient music that needs to play after unlock
    }

    /**
     * Initialize the audio manager
     */
    async initialize() {
        console.log('🔊 Initializing Audio Manager...')
        
        // Find and register all audio elements
        this.registerAudioElements()
        
        // Set up event listeners
        this.setupEventListeners()
        
        // Load saved audio settings
        this.loadAudioSettings()
        
        console.log('✅ Audio Manager initialized')
    }

    /**
     * Register all audio elements from the DOM
     */
    registerAudioElements() {
        const audioElements = document.querySelectorAll('audio')
        
        audioElements.forEach(audio => {
            const id = audio.id
            if (id) {
                this.audioElements.set(id, audio)
                
                // Set up audio element properties
                audio.preload = 'auto'
                
                // Add event listeners
                audio.addEventListener('ended', () => {
                    this.emit('audioEnded', id)
                })
                
                audio.addEventListener('error', (e) => {
                    console.warn(`🔊 Audio error for ${id}:`, e)
                    this.emit('audioError', { id, error: e })
                })
                
                console.log(`🔊 Registered audio element: ${id}`)
            }
        })
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for mute toggle from UI
        this.game.uiManager?.on('muteToggled', this.toggleMute.bind(this))

        // Listen for volume changes
        this.game.uiManager?.on('volumeChanged', this.setMasterVolume.bind(this))

        // Unlock audio on first user interaction (required by browsers)
        this.unlockAudio()
    }

    /**
     * Unlock audio playback (required by browser autoplay policies)
     * This must be called after a user interaction
     */
    unlockAudio() {
        const unlock = () => {
            // Try to play and immediately pause all audio elements
            this.audioElements.forEach((audio) => {
                audio.play().then(() => {
                    audio.pause()
                    audio.currentTime = 0
                }).catch(() => {
                    // Ignore errors during unlock
                })
            })

            // Remove the event listeners after first unlock
            document.removeEventListener('click', unlock)
            document.removeEventListener('touchstart', unlock)
            document.removeEventListener('keydown', unlock)
        }

        // Listen for first user interaction
        document.addEventListener('click', unlock, { once: true })
        document.addEventListener('touchstart', unlock, { once: true })
        document.addEventListener('keydown', unlock, { once: true })
    }

    /**
     * Play ambient music
     * @param {string} trackId - ID of the audio element to play
     * @param {boolean} fadeIn - Whether to fade in the audio
     */
    async playAmbient(trackId, fadeIn = true) {
        if (!trackId || trackId === 'silence') {
            this.stopAmbient()
            this.pendingAmbient = null
            return
        }

        const audio = this.audioElements.get(trackId)
        if (!audio) {
            console.warn(`🔊 Ambient track not found: ${trackId}`)
            return
        }

        // Stop current ambient if playing
        if (this.currentAmbient && this.currentAmbient !== audio) {
            await this.stopAmbient(true) // Fade out current
            // Small delay to ensure audio state is clean
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Don't restart if same track is already playing
        if (this.currentAmbient === audio && !audio.paused) {
            return
        }

        try {
            // Reset audio element state
            audio.pause()
            audio.currentTime = 0

            this.currentAmbient = audio
            audio.loop = true
            audio.volume = fadeIn ? 0 : this.musicVolume * this.masterVolume

            await audio.play()

            if (fadeIn) {
                this.fadeIn(audio, this.musicVolume * this.masterVolume)
            }

            console.log(`🔊 Playing ambient: ${trackId}`)
            this.emit('ambientStarted', trackId)
            this.audioUnlocked = true
            this.pendingAmbient = null

        } catch (error) {
            console.warn(`🔊 Ambient playback blocked (autoplay policy): ${trackId}`)
            // Store for later playback after user interaction
            this.pendingAmbient = { trackId, fadeIn }
        }
    }

    /**
     * Stop ambient music
     * @param {boolean} fadeOut - Whether to fade out the audio
     */
    async stopAmbient(fadeOut = false) {
        if (!this.currentAmbient) return

        const audio = this.currentAmbient
        
        if (fadeOut) {
            await this.fadeOut(audio)
        } else {
            audio.pause()
            audio.currentTime = 0
        }
        
        this.currentAmbient = null
        this.emit('ambientStopped')
    }

    /**
     * Play a sound effect
     * @param {string} soundId - ID of the sound to play
     * @param {number} volume - Volume override (0-1)
     */
    playSound(soundId, volume = null) {
        const audio = this.audioElements.get(soundId)
        if (!audio) {
            console.warn(`🔊 Sound not found: ${soundId}`)
            return
        }

        try {
            // Clone the audio element for overlapping sounds
            const soundClone = audio.cloneNode(true)
            soundClone.volume = (volume !== null ? volume : this.sfxVolume) * this.masterVolume

            // Clean up after playing
            soundClone.addEventListener('ended', () => {
                soundClone.remove()
            })

            soundClone.play().then(() => {
                // Audio unlocked successfully
                if (!this.audioUnlocked) {
                    this.audioUnlocked = true
                    console.log('🔊 Audio context unlocked')

                    // Play pending ambient if any
                    if (this.pendingAmbient) {
                        console.log(`🔊 Playing pending ambient: ${this.pendingAmbient.trackId}`)
                        const { trackId, fadeIn } = this.pendingAmbient
                        this.playAmbient(trackId, fadeIn)
                    }
                }
            }).catch(err => {
                console.warn(`🔊 Failed to play sound ${soundId}:`, err.message)
            })

            this.emit('soundPlayed', soundId)

        } catch (error) {
            console.error(`🔊 Failed to play sound ${soundId}:`, error)
        }
    }

    /**
     * Fade in audio
     * @param {HTMLAudioElement} audio - Audio element
     * @param {number} targetVolume - Target volume (0-1)
     * @param {number} duration - Fade duration in milliseconds (uses config default)
     */
    fadeIn(audio, targetVolume = 1, duration = this.fadeInDuration) {
        return new Promise((resolve) => {
            if (this.isMuted) {
                resolve()
                return
            }

            const startVolume = 0
            const volumeStep = targetVolume / (duration / 50)
            let currentVolume = startVolume
            
            audio.volume = currentVolume
            
            const fadeInterval = setInterval(() => {
                currentVolume += volumeStep
                
                if (currentVolume >= targetVolume) {
                    currentVolume = targetVolume
                    clearInterval(fadeInterval)
                    resolve()
                }
                
                audio.volume = this.isMuted ? 0 : currentVolume
            }, 50)
        })
    }

    /**
     * Fade out audio
     * @param {HTMLAudioElement} audio - Audio element
     * @param {number} duration - Fade duration in milliseconds (uses config default)
     */
    fadeOut(audio, duration = this.fadeOutDuration) {
        return new Promise((resolve) => {
            const startVolume = audio.volume
            const volumeStep = startVolume / (duration / 50)
            let currentVolume = startVolume
            
            const fadeInterval = setInterval(() => {
                currentVolume -= volumeStep
                
                if (currentVolume <= 0) {
                    currentVolume = 0
                    audio.volume = 0
                    audio.pause()
                    audio.currentTime = 0
                    clearInterval(fadeInterval)
                    resolve()
                } else {
                    audio.volume = currentVolume
                }
            }, 50)
        })
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        this.isMuted = !this.isMuted
        this.updateAllVolumes()
        this.saveAudioSettings()
        
        console.log(`🔊 Audio ${this.isMuted ? 'muted' : 'unmuted'}`)
        this.emit('muteToggled', this.isMuted)
    }

    /**
     * Set master volume
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume))
        this.updateAllVolumes()
        this.saveAudioSettings()
        
        this.emit('volumeChanged', this.masterVolume)
    }

    /**
     * Set music volume
     * @param {number} volume - Volume level (0-1)
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume))
        this.updateAllVolumes()
        this.saveAudioSettings()
    }

    /**
     * Set sound effects volume
     * @param {number} volume - Volume level (0-1)
     */
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume))
        this.saveAudioSettings()
    }

    /**
     * Update volumes for all playing audio
     */
    updateAllVolumes() {
        if (this.currentAmbient) {
            this.currentAmbient.volume = this.isMuted ? 0 : this.musicVolume * this.masterVolume
        }
    }

    /**
     * Pause all audio
     */
    pauseAll() {
        this.audioElements.forEach(audio => {
            if (!audio.paused) {
                audio.pause()
            }
        })
        
        this.emit('allAudioPaused')
    }

    /**
     * Resume all audio
     */
    resumeAll() {
        if (this.currentAmbient && this.currentAmbient.paused) {
            this.currentAmbient.play().catch(console.error)
        }
        
        this.emit('allAudioResumed')
    }

    /**
     * Stop all audio
     */
    stopAll() {
        this.audioElements.forEach(audio => {
            audio.pause()
            audio.currentTime = 0
        })
        
        this.currentAmbient = null
        this.emit('allAudioStopped')
    }

    /**
     * Save audio settings to localStorage
     */
    saveAudioSettings() {
        const settings = {
            isMuted: this.isMuted,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume
        }
        
        localStorage.setItem('audioSettings', JSON.stringify(settings))
    }

    /**
     * Load audio settings from localStorage
     */
    loadAudioSettings() {
        try {
            const saved = localStorage.getItem('audioSettings')
            if (saved) {
                const settings = JSON.parse(saved)

                this.isMuted = settings.isMuted || false
                this.masterVolume = settings.masterVolume || 1.0
                this.musicVolume = settings.musicVolume || audio.defaultVolume
                this.sfxVolume = settings.sfxVolume || 0.8
            }

            // Always update volumes to apply config defaults or loaded settings
            this.updateAllVolumes()
        } catch (error) {
            console.warn('🔊 Failed to load audio settings:', error)
        }
    }

    /**
     * Get current audio state
     * @returns {Object} Audio state information
     */
    getAudioState() {
        return {
            isMuted: this.isMuted,
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            currentAmbient: this.currentAmbient?.id || null
        }
    }

    /**
     * Destroy the audio manager
     */
    destroy() {
        this.stopAll()
        this.audioElements.clear()
        this.currentAmbient = null
        
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval)
        }
        
        this.removeAllListeners()
    }
}
