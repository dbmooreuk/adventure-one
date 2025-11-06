/**
 * Random failure messages for when items can't be used together
 * These are displayed when a user tries to use an item on something it can't be used on
 */

export const failureMessages = [
    "That doesn't work.",
    "You really must concentrate.",
    "That was a pretty silly thing to try.",
    "Really??",
    "It's getting late, I have got places to go!",
    "That's not going to work.",
    "Nice try, but no.",
    "I don't think that's the right approach.",
    "Maybe try something else?",
    "That combination doesn't make sense.",
    "Nope, that's not it.",
    "You can't use those together.",
    "That's... creative, but no.",
    "Let's think about this differently.",
    "That's not quite right.",
    "Are you even trying?",
    "Focus! That won't work.",
    "Interesting idea, but no.",
    "That's not the solution.",
    "Try again with something else."
]

/**
 * Get a random failure message
 * @returns {string} Random failure message
 */
export function getRandomFailureMessage() {
    const randomIndex = Math.floor(Math.random() * failureMessages.length)
    return failureMessages[randomIndex]
}

