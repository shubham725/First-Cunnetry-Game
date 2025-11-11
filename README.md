# 🏁 Flag Race Live: The World Speed Cup

An interactive, donation-powered flag racing game perfect for YouTube Live streams!

## Features

### ⚡ Core Features
- **4 Countries Racing**: USA 🇺🇸, India 🇮🇳, Japan 🇯🇵, UK 🇬🇧
- **Real-time Racing**: Flags race horizontally across the screen
- **30-Minute Races**: Optimized for extended streaming sessions
- **Online Flag Images**: Real country flags from FlagCDN API
- **Donation-Powered**: SuperChats and donations give speed boosts
- **YouTube Live Ready**: Fully visible and interactive in live streams
- **Mobile Friendly**: Fully responsive design with no horizontal scrolling

### 🎮 Interactive Features

#### Viewer-Triggered Actions
- **Chat Commands**: 
  - `!boost [country]` - Adds speed boost to a specific country
  - `!vote [country]` - Vote for your favorite country
  - **Any chat message** - Automatically boosts all racers slightly!
- **Donations**: Real-time speed boosts based on donation amount
- **Like Goals**: Every 50 likes triggers a random wind push

#### Visual Effects
- **Dynamic Backgrounds**: Changes every 20 seconds (Desert, Snow, Stadium, Galaxy, Cityscape)
- **Boost Effects**: 
  - Motion trails
  - Glowing borders
  - Particle effects (🚀🔥💨)
  - Fireworks for mega boosts
- **Animated Flags**: Pulse and scale effects during boosts

#### Audio System
- Sound effects for boosts, donations, wins, and events
- Text-to-Speech announcements for big donations
- Crowd cheering effects

#### Game Mechanics
- **30-Minute Race Duration**: Optimized speeds for extended gameplay
- **Leaderboard**: Tracks wins across multiple rounds, updates every 5 seconds
- **Mini-Events**: Random events every 30 seconds:
  - 🌪️ Storm: Speeds cut in half
  - 💨 Tailwind: Everyone gains speed boost
  - 🔥 Power Surge: Random country gets x2 speed
- **Donation Tiers** (adjusted for 30-min races):
  - $10: Speed Boost (0.01 for 5s)
  - $50: Super Boost (0.03 for 10s)
  - $100: Nitro Boost (1.5x multiplier + 0.05 for 10s)
  - $500+: Mega Boost (2x multiplier + 0.08 for 15s)

#### Top Supporters
- Displays top 5 supporters after each race
- Tracks donations and shows recognition

## How to Use

### Basic Setup
1. Open `index.html` in a web browser
2. The game will start automatically
3. Use the control panel to simulate donations and chat commands

### For YouTube Live Stream

1. **OBS Studio Setup**:
   - Add a Browser Source
   - Point it to your `index.html` file
   - Set width: 1920px, height: 1080px
   - Enable "Shutdown source when not visible" (optional)

2. **YouTube Live Chat Integration**:
   - Get YouTube Data API v3 key from Google Cloud Console
   - Enable YouTube Data API v3
   - Update `connectYouTubeChat()` function in `game.js` with your API key and video ID
   - The function will poll for new chat messages and process commands

### Chat Commands for Viewers
- `!boost usa` - Boost USA
- `!boost india` - Boost India
- `!boost japan` - Boost Japan
- `!boost uk` - Boost UK
- `!vote [country]` - Vote for a country

### Testing
Use the control panel on the left side to:
- Simulate chat commands
- Test donations
- Trigger random events

## Customization

### Change Countries
Edit `countryConfig` in `game.js`:
```javascript
const countryConfig = {
    usa: { flag: '🇺🇸', name: 'USA', color: '#B22234', emoji: '🦅' },
    // Add more countries...
};
```

### Adjust Race Duration
Change `raceDuration` in `gameState`:
```javascript
raceDuration: 60000, // 60 seconds in milliseconds
```

### Modify Donation Tiers
Edit `donationTiers` in `game.js`:
```javascript
const donationTiers = {
    10: { type: 'speed', boost: 0.5, duration: 5000, effect: 'speed' },
    // Add more tiers...
};
```

### Change Background Themes
Modify `backgroundThemes` array in `gameState`:
```javascript
backgroundThemes: ['desert', 'snow', 'stadium', 'galaxy', 'cityscape'],
```

## YouTube API Integration

To connect real YouTube Live Chat:

1. **Get API Key**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable YouTube Data API v3
   - Create credentials (API Key)

2. **Get Live Chat ID**:
   - When streaming, get the `liveChatId` from your live stream
   - You can find it in the YouTube API response

3. **Update Code**:
   ```javascript
   connectYouTubeChat('YOUR_API_KEY', 'YOUR_VIDEO_ID');
   ```

4. **Handle SuperChats**:
   - SuperChats come through the live chat API
   - Parse the message for donation amounts
   - Call `handleDonation(country, amount, username)`

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may need user interaction for audio)

## Tips for Streamers

1. **Commentary**: Add energetic commentary ("India takes the lead!")
2. **Race Length**: Keep races short (30-60 seconds) for engagement
3. **Multiple Rounds**: Run multiple rounds with score tracking
4. **Themed Races**: Change themes for special events (World Cup, Olympics, etc.)
5. **Engagement**: Encourage viewers to use chat commands and donate

## Future Enhancements

- [ ] Firebase integration for persistent leaderboards
- [ ] Custom flag skins/avatars
- [ ] Poll system for crowd votes
- [ ] Themed races (World Cup, Olympics, etc.)
- [ ] Discord integration for winners
- [ ] More countries and customization options

## License

Free to use for streaming and personal projects!

---

**Enjoy your Flag Race Live! 🏁🌍💥**

