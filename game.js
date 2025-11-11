// Game State
const gameState = {
    racers: {
        usa: { position: 0, baseSpeed: 0.015, currentSpeed: 0.015, boosts: [], wins: 0 },
        india: { position: 0, baseSpeed: 0.015, currentSpeed: 0.015, boosts: [], wins: 0 },
        japan: { position: 0, baseSpeed: 0.015, currentSpeed: 0.015, boosts: [], wins: 0 },
        uk: { position: 0, baseSpeed: 0.015, currentSpeed: 0.015, boosts: [], wins: 0 }
    },
    raceActive: false,
    raceStartTime: null,
    raceDuration: 1800000, // 30 minutes (30 * 60 * 1000)
    roundNumber: 1,
    finishLine: (typeof window !== 'undefined' ? window.innerWidth : 1920) - 100,
    supporters: [],
    globalEvent: null,
    backgroundThemes: ['desert', 'snow', 'stadium', 'galaxy', 'cityscape'],
    currentBackground: 0,
    likeCount: 0,
    winner: null
};

// Country Config
const countryConfig = {
    usa: { flag: 'https://flagcdn.com/w320/us.png', flagEmoji: '🇺🇸', name: 'USA', color: '#B22234', emoji: '🦅', code: 'us' },
    india: { flag: 'https://flagcdn.com/w320/in.png', flagEmoji: '🇮🇳', name: 'India', color: '#FF9933', emoji: '🐅', code: 'in' },
    japan: { flag: 'https://flagcdn.com/w320/jp.png', flagEmoji: '🇯🇵', name: 'Japan', color: '#BC002D', emoji: '🐉', code: 'jp' },
    uk: { flag: 'https://flagcdn.com/w320/gb.png', flagEmoji: '🇬🇧', name: 'UK', color: '#012169', emoji: '👑', code: 'gb' }
};

// Donation Tiers (adjusted for 30-minute race)
const donationTiers = {
    10: { type: 'speed', boost: 0.01, duration: 5000, effect: 'speed' },
    50: { type: 'super', boost: 0.03, duration: 10000, effect: 'super' },
    100: { type: 'nitro', boost: 0.05, multiplier: 1.5, duration: 10000, effect: 'nitro' },
    500: { type: 'mega', boost: 0.08, multiplier: 2, duration: 15000, effect: 'mega' }
};

// Initialize Game
function initGame() {
    // Update finish line based on current window size (account for mobile)
    const finishLineOffset = window.innerWidth < 768 ? 20 : 100;
    gameState.finishLine = Math.min(window.innerWidth - finishLineOffset, window.innerWidth - 20);
    
    // Initialize leaderboard
    updateLeaderboard();
    
    // Start race
    startRace();
    
    // Set up intervals
    setInterval(updateBackground, 20000); // Change background every 20s
    setInterval(checkMiniEvents, 30000); // Check for mini-events every 30s
    setInterval(updateBoosts, 100); // Update boost timers
    setInterval(updateLeaderboard, 5000); // Update leaderboard every 5 seconds
    
    // Focus chat input for better UX
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        // Don't auto-focus on mobile to prevent keyboard popup
        if (window.innerWidth > 768) {
            setTimeout(() => chatInput.focus(), 1000);
        }
    }
    
    // Add welcome message
    setTimeout(() => {
        addChatMessage('🏁 Race started! Type any message to boost all racers!', false);
    }, 2000);
}

// Start Race
function startRace() {
    gameState.raceActive = true;
    gameState.raceStartTime = Date.now();
    
        // Reset positions
        const startOffset = window.innerWidth < 768 ? 20 : 50;
        Object.keys(gameState.racers).forEach(country => {
            gameState.racers[country].position = 0;
            gameState.racers[country].currentSpeed = gameState.racers[country].baseSpeed;
            gameState.racers[country].boosts = [];
            const racer = document.getElementById(`racer-${country}`);
            if (racer) {
                racer.style.left = `${startOffset}px`;
                racer.classList.remove('boosting');
            }
        });
    
    // Update finish line position (account for mobile)
    const finishLineOffset = window.innerWidth < 768 ? 20 : 100;
    gameState.finishLine = Math.min(window.innerWidth - finishLineOffset, window.innerWidth - 20);
    
    // Start game loop
    gameLoop();
    
    // Show race start message
    showEvent('🏁 Race Started!', 2000);
    playSound('start');
}

// Game Loop
function gameLoop() {
    if (!gameState.raceActive) return;
    
    const elapsed = Date.now() - gameState.raceStartTime;
    const remaining = Math.max(0, gameState.raceDuration - elapsed);
    
    // Update timer
    updateTimer(remaining);
    
    // Update racer positions
    Object.keys(gameState.racers).forEach(country => {
        const racer = gameState.racers[country];
        
        // Calculate current speed (base + boosts + global event)
        let speed = racer.baseSpeed;
        
        // Apply active boosts
        racer.boosts.forEach(boost => {
            if (boost.type === 'multiplier') {
                speed *= boost.value;
            } else {
                speed += boost.value;
            }
        });
        
        // Apply global event effects (adjusted for 30-minute race)
        if (gameState.globalEvent) {
            if (gameState.globalEvent.type === 'storm') {
                speed *= 0.5;
            } else if (gameState.globalEvent.type === 'tailwind') {
                speed += 0.01;
            } else if (gameState.globalEvent.type === 'powerSurge' && gameState.globalEvent.target === country) {
                speed *= 2;
            }
        }
        
        racer.currentSpeed = speed;
        
        // Update position
        racer.position += speed;
        
        // Update visual position
        const racerElement = document.getElementById(`racer-${country}`);
        if (racerElement) {
            const startOffset = window.innerWidth < 768 ? 20 : 50;
            const racerWidth = window.innerWidth < 768 ? 60 : 120;
            const newLeft = Math.min(startOffset + racer.position, gameState.finishLine - racerWidth);
            racerElement.style.left = `${newLeft}px`;
            
            // Update speed indicator
            const speedIndicator = document.getElementById(`speed-${country}`);
            if (speedIndicator) {
                speedIndicator.textContent = speed.toFixed(1) + 'x';
            }
        }
        
        // Check for winner
        if (racer.position >= gameState.finishLine - 50 && !gameState.winner) {
            declareWinner(country);
            return;
        }
    });
    
    // Check if race time expired
    if (remaining <= 0 && !gameState.winner) {
        // Find closest to finish
        let winner = null;
        let maxPosition = 0;
        Object.keys(gameState.racers).forEach(country => {
            if (gameState.racers[country].position > maxPosition) {
                maxPosition = gameState.racers[country].position;
                winner = country;
            }
        });
        if (winner) declareWinner(winner);
        return;
    }
    
    requestAnimationFrame(gameLoop);
}

// Declare Winner
function declareWinner(country) {
    gameState.raceActive = false;
    gameState.winner = country;
    gameState.racers[country].wins++;
    
    const config = countryConfig[country];
    const announcement = document.getElementById('winnerAnnouncement');
    announcement.innerHTML = `
        <div style="font-size: 1.2em; margin-bottom: 20px;">🏁 Race Finished! 🏁</div>
        <div style="font-size: 1.5em; color: #ffd700;">Winner: ${config.flag} ${config.name}</div>
        <div style="font-size: 0.8em; margin-top: 20px; color: #aaa;">Round ${gameState.roundNumber}</div>
    `;
    announcement.classList.add('active');
    
    playSound('win');
    createFireworks(country);
    updateLeaderboard();
    
    // Show top supporters
    updateSupporters();
    
    // Reset after 5 seconds
    setTimeout(() => {
        announcement.classList.remove('active');
        gameState.winner = null;
        gameState.roundNumber++;
        document.getElementById('roundNumber').textContent = gameState.roundNumber;
        setTimeout(startRace, 2000);
    }, 5000);
}

// Update Timer
function updateTimer(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    document.getElementById('timer').textContent = display;
}

// Update Leaderboard
function updateLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (!leaderboard) return;
    
    const entries = Object.keys(gameState.racers)
        .map(country => ({
            country,
            wins: gameState.racers[country].wins || 0,
            config: countryConfig[country],
            position: gameState.racers[country].position || 0
        }))
        .sort((a, b) => {
            // Sort by wins first, then by current position
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.position - a.position;
        });
    
    leaderboard.innerHTML = '';
    
    if (entries.length === 0) {
        leaderboard.innerHTML = '<div class="leaderboard-entry">No data available</div>';
        return;
    }
    
    entries.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'leaderboard-entry';
        if (index === 0 && entry.wins > 0) div.classList.add('winner');
        
        const rankText = index + 1;
        const ordinal = getOrdinal(rankText);
        const winsText = entry.wins === 1 ? '1 win' : `${entry.wins} wins`;
        
        div.innerHTML = `
            <span class="rank">${rankText}${ordinal}</span>
            <span class="country-flag"><img src="${entry.config.flag}" alt="${entry.config.name} Flag" class="leaderboard-flag"></span>
            <span class="country-name">${entry.config.name}</span>
            <span class="wins">${winsText}</span>
        `;
        leaderboard.appendChild(div);
    });
}

function getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

// Handle Chat Commands
function handleChatCommand(message, username = 'Viewer') {
    const lowerMsg = message.toLowerCase();
    
    // Any chat message boosts all racers slightly (reduced for 30-min race)
    const chatBoost = { type: 'speed', value: 0.005, duration: 2000, effect: 'speed' };
    Object.keys(gameState.racers).forEach(country => {
        applyBoost(country, chatBoost);
    });
    
    // !boost [country] - specific country boost
    const boostMatch = lowerMsg.match(/!boost\s+(usa|india|japan|uk|united states|united kingdom)/);
    if (boostMatch) {
        let country = boostMatch[1];
        if (country === 'united states') country = 'usa';
        if (country === 'united kingdom') country = 'uk';
        
        applyBoost(country, { type: 'speed', value: 0.01, duration: 4000, effect: 'speed' });
        addChatMessage(`${username}: ${message}`, false);
        showParticles(country, '🚀');
        playSound('boost');
        return true;
    }
    
    // !vote [country]
    const voteMatch = lowerMsg.match(/!vote\s+(usa|india|japan|uk)/);
    if (voteMatch) {
        let country = voteMatch[1];
        applyBoost(country, { type: 'speed', value: 0.008, duration: 3000, effect: 'speed' });
        addChatMessage(`${username}: Voted for ${countryConfig[country].name}`, false);
        return true;
    }
    
    // Regular chat message - still boosts all
    addChatMessage(`${username}: ${message}`, false);
    playSound('boost');
    return true;
}

// Handle Donation
function handleDonation(country, amount, username = 'Supporter') {
    const tier = getDonationTier(amount);
    if (!tier) return;
    
    const boost = {
        type: tier.type === 'nitro' || tier.type === 'mega' ? 'multiplier' : 'speed',
        value: tier.boost || tier.multiplier,
        duration: tier.duration,
        effect: tier.effect,
        amount: amount
    };
    
    applyBoost(country, boost);
    
    // Add to supporters
    gameState.supporters.push({
        username,
        country,
        amount,
        timestamp: Date.now()
    });
    
    // Keep only top 10
    gameState.supporters.sort((a, b) => b.amount - a.amount);
    gameState.supporters = gameState.supporters.slice(0, 10);
    
    // Show donation message
    const config = countryConfig[country];
    addChatMessage(`💰 ${username} donated $${amount} to ${config.flagEmoji} ${config.name}!`, true);
    
    // Visual effects based on tier
    if (tier.effect === 'mega') {
        createFireworks(country);
        showEvent(`⚡ MEGA BOOST! ${config.name} gets ${tier.effect.toUpperCase()}!`, 3000);
    } else {
        showParticles(country, ['🚀', '🔥', '💨'][Math.floor(Math.random() * 3)]);
    }
    
    // TTS announcement for big donations
    if (amount >= 100) {
        speakText(`Go ${config.name} Go!`);
    }
    
    playSound('donation');
}

// Get Donation Tier
function getDonationTier(amount) {
    const tiers = Object.keys(donationTiers).map(Number).sort((a, b) => b - a);
    for (const tier of tiers) {
        if (amount >= tier) {
            return { ...donationTiers[tier] };
        }
    }
    return null;
}

// Apply Boost
function applyBoost(country, boost) {
    if (!gameState.raceActive) return;
    
    const racer = gameState.racers[country];
    const boostEndTime = Date.now() + boost.duration;
    
    racer.boosts.push({
        ...boost,
        endTime: boostEndTime
    });
    
    // Visual effect
    const racerElement = document.getElementById(`racer-${country}`);
    const boostOverlay = document.getElementById(`boost-${country}`);
    
    if (racerElement && boostOverlay) {
        racerElement.classList.add('boosting');
        boostOverlay.className = `boost-overlay ${boost.effect}`;
        
        setTimeout(() => {
            racerElement.classList.remove('boosting');
            boostOverlay.className = 'boost-overlay';
        }, boost.duration);
    }
}

// Update Boosts
function updateBoosts() {
    const now = Date.now();
    Object.keys(gameState.racers).forEach(country => {
        const racer = gameState.racers[country];
        racer.boosts = racer.boosts.filter(boost => boost.endTime > now);
    });
}

// Mini Events
function checkMiniEvents() {
    if (!gameState.raceActive || gameState.globalEvent) return;
    
    const events = [
        { type: 'storm', name: '🌪️ Storm!', message: 'Speeds cut in half!', duration: 10000 },
        { type: 'tailwind', name: '💨 Tailwind!', message: 'Everyone gains speed boost!', duration: 8000 },
        { type: 'powerSurge', name: '🔥 Power Surge!', message: 'Random country gets x2 speed!', duration: 5000 }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    if (event.type === 'powerSurge') {
        const countries = Object.keys(gameState.racers);
        event.target = countries[Math.floor(Math.random() * countries.length)];
        event.message = `${countryConfig[event.target].name} gets x2 speed!`;
    }
    
    gameState.globalEvent = {
        ...event,
        startTime: Date.now()
    };
    
    showEvent(`${event.name} ${event.message}`, 3000);
    playSound('event');
    
    setTimeout(() => {
        gameState.globalEvent = null;
    }, event.duration);
}

// Show Event
function showEvent(message, duration = 3000) {
    const eventDisplay = document.getElementById('eventDisplay');
    eventDisplay.textContent = message;
    eventDisplay.classList.add('active');
    
    setTimeout(() => {
        eventDisplay.classList.remove('active');
    }, duration);
}

// Show Particles
function showParticles(country, emojis) {
    const racer = document.getElementById(`racer-${country}`);
    if (!racer) return;
    
    const rect = racer.getBoundingClientRect();
    const emojiArray = Array.isArray(emojis) ? emojis : [emojis];
    
    emojiArray.forEach((emoji, i) => {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emoji;
            particle.style.left = `${rect.left + rect.width / 2}px`;
            particle.style.top = `${rect.top + rect.height / 2}px`;
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 2000);
        }, i * 100);
    });
}

// Create Fireworks
function createFireworks(country) {
    const racer = document.getElementById(`racer-${country}`);
    if (!racer) return;
    
    const rect = racer.getBoundingClientRect();
    const emojis = ['🎆', '✨', '🎇', '💥', '⭐'];
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.left = `${rect.left + rect.width / 2 + (Math.random() - 0.5) * 200}px`;
            particle.style.top = `${rect.top + rect.height / 2 + (Math.random() - 0.5) * 200}px`;
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 2000);
        }, i * 50);
    }
}

// Update Background
function updateBackground() {
    const bgLayer = document.getElementById('backgroundLayer');
    bgLayer.className = 'background-layer';
    
    gameState.currentBackground = (gameState.currentBackground + 1) % gameState.backgroundThemes.length;
    const theme = gameState.backgroundThemes[gameState.currentBackground];
    
    setTimeout(() => {
        bgLayer.classList.add(theme);
    }, 100);
}

// Update Supporters
function updateSupporters() {
    const supportersList = document.getElementById('supportersList');
    supportersList.innerHTML = '';
    
    const topSupporters = gameState.supporters.slice(0, 5);
    topSupporters.forEach(supporter => {
        const div = document.createElement('div');
        div.className = 'supporter-item';
        div.innerHTML = `
            <span class="supporter-flag"><img src="${countryConfig[supporter.country].flag}" alt="${countryConfig[supporter.country].name} Flag" class="supporter-flag-img"></span>
            <strong>${supporter.username}</strong> - $${supporter.amount}
        `;
        supportersList.appendChild(div);
    });
}

// Add Chat Message
function addChatMessage(message, isDonation = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const div = document.createElement('div');
    div.className = `chat-message ${isDonation ? 'donation' : ''}`;
    div.textContent = message;
    div.setAttribute('data-timestamp', Date.now());
    chatMessages.appendChild(div);
    
    // Auto-scroll with smooth behavior
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
    
    // Keep only last 50 messages
    while (chatMessages.children.length > 50) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
    
    // Highlight new messages briefly
    div.classList.add('new-message');
    setTimeout(() => {
        div.classList.remove('new-message');
    }, 1000);
}

// Handle Chat Input
function handleChatInput(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        sendChatMessage();
        event.preventDefault();
        return false;
    }
    return true;
}

// Send Chat Message
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (message) {
        handleChatCommand(message, 'You');
        input.value = '';
        input.focus();
    }
}

// Audio System
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    // Create simple sound effects using Web Audio API
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'boost':
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'donation':
            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'win':
            // Victory sound
            [523, 659, 784].forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    osc.start();
                    osc.stop(audioContext.currentTime + 0.3);
                }, i * 150);
            });
            break;
        case 'event':
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'start':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
    }
}

// Text-to-Speech
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 1.1;
        speechSynthesis.speak(utterance);
    }
}

// Simulation Functions (for testing)
function simulateChatCommand(command) {
    handleChatCommand(command, 'TestUser');
}

function simulateDonation(country, amount) {
    handleDonation(country, amount, 'TestSupporter');
}

function triggerRandomEvent() {
    checkMiniEvents();
}

// YouTube Live Chat API Integration (Placeholder)
// Replace this with actual YouTube API integration
function connectYouTubeChat(apiKey, videoId) {
    // This would connect to YouTube Live Chat API
    // For now, we'll simulate it
    console.log('YouTube Chat API integration needed');
    console.log('Use: https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list');
    
    // Example: Poll YouTube API every 5 seconds
    // setInterval(() => {
    //     fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${chatId}&part=snippet&key=${apiKey}`)
    //         .then(response => response.json())
    //         .then(data => {
    //             data.items.forEach(item => {
    //                 const message = item.snippet.displayMessage;
    //                 const author = item.snippet.authorDetails.displayName;
    //                 handleChatCommand(message, author);
    //             });
    //         });
    // }, 5000);
}

// Handle Like Goal
function handleLike() {
    gameState.likeCount++;
    if (gameState.likeCount % 50 === 0) {
        // Random flag gets wind push (adjusted for 30-minute race)
        const countries = Object.keys(gameState.racers);
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        applyBoost(randomCountry, { type: 'speed', value: 0.01, duration: 3000, effect: 'speed' });
        showEvent(`💨 ${gameState.likeCount} Likes! ${countryConfig[randomCountry].name} gets wind push!`, 2000);
    }
}

// Initialize on load
window.addEventListener('load', () => {
    initGame();
});

// Handle window resize
window.addEventListener('resize', () => {
    const finishLineOffset = window.innerWidth < 768 ? 20 : 100;
    gameState.finishLine = Math.min(window.innerWidth - finishLineOffset, window.innerWidth - 20);
    // Update racer positions if race is active
    if (gameState.raceActive) {
        const startOffset = window.innerWidth < 768 ? 20 : 50;
        const racerWidth = window.innerWidth < 768 ? 60 : 120;
        Object.keys(gameState.racers).forEach(country => {
            const racerElement = document.getElementById(`racer-${country}`);
            if (racerElement) {
                const racer = gameState.racers[country];
                const newLeft = Math.min(startOffset + racer.position, gameState.finishLine - racerWidth);
                racerElement.style.left = `${newLeft}px`;
            }
        });
    }
});

