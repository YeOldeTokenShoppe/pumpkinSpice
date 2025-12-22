# Translation System Guide

## Overview
Your app has a comprehensive translation system that automatically detects the user's language and translates content without needing manual language selection.

## How It Works

### 1. Automatic Language Detection
The system automatically detects language from:
- **Browser language** (primary method) - e.g., a user in Japan gets Japanese
- **URL parameter** (for testing) - add `?lang=ja` to any URL
- No manual dropdown needed!

### 2. Three Translation Systems Working Together

#### A. Special Animated Components (Custom Implementations)
These handle text that standard translators can't process:

**TranslatableDropInTitle** (`/src/components/TranslatableDropInTitle.jsx`)
- Character-by-character animations
- Translates "PROSPER80" → "PROSPERITY" (or language equivalent)
- Usage:
```jsx
<TranslatableDropInTitle
  lines={["PROSPER80", "FOR ALL", "HUMAN80!"]}
  language={language}
/>
```

**Drone Screen** (Canvas text in `/src/app/home3/page.js`)
- Uses `getDroneText()` function
- Translations in `/src/utils/droneTranslations.js`
- Usage:
```javascript
ctx.fillText(getDroneText('CLOUD_TERMINAL_v2.1', object.userData.language), x, y);
```

#### B. Regular HTML Text (LanguageProvider System)
For standard headings, buttons, and text:

**Setup in any component:**
```jsx
import { useLanguage } from '@/components/LanguageProvider';

export default function MyComponent() {
  const { locale: language, t } = useLanguage();
  
  return (
    <div>
      <h2>{t('home.welcome')}</h2>
      <button>{t('home.buyNow')}</button>
    </div>
  );
}
```

## File Structure

```
/pumpkinspice
├── /messages                       # Translation files for regular text
│   ├── en.json                    # English translations
│   ├── es.json                    # Spanish translations
│   ├── fr.json                    # French translations
│   └── ja.json                    # Japanese translations
├── /src
│   ├── /components
│   │   ├── LanguageProvider.jsx   # Context provider for translations
│   │   └── TranslatableDropInTitle.jsx  # Animated title component
│   └── /utils
│       └── droneTranslations.js   # Drone screen text translations
```

## Adding New Translations

### Step 1: Add to Translation Files

**For regular text**, edit `/messages/[language].json`:
```json
{
  "home": {
    "welcome": "Welcome",
    "newFeature": "New Feature Text"  // Add new key
  }
}
```

**For drone screen**, edit `/src/utils/droneTranslations.js`:
```javascript
'NEW_MENU_ITEM': 'New Menu Item',  // Add to each language
```

**For DropInTitle**, edit `/src/components/TranslatableDropInTitle.jsx`:
```javascript
'NEW_WORD': 'TRANSLATION',  // Add to translations object
```

### Step 2: Use in Components

```jsx
// Regular text
<p>{t('home.newFeature')}</p>

// Drone screen (in canvas drawing functions)
ctx.fillText(getDroneText('NEW_MENU_ITEM', object.userData.language), x, y);

// DropInTitle
<TranslatableDropInTitle lines={["NEW_WORD"]} language={language} />
```

## Supported Languages

Currently configured:
- `en` - English (default)
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese
- `zh` - Chinese

To add a new language:
1. Create `/messages/[langCode].json`
2. Add translations to all three systems
3. Import in `/src/components/LanguageProvider.jsx`

## Testing

### Test Different Languages
Add `?lang=` parameter to URL:
- `http://localhost:3000/home3?lang=ja` - Japanese
- `http://localhost:3000/home3?lang=es` - Spanish
- `http://localhost:3000/home3?lang=fr` - French

### Check Browser Detection
1. Change browser language in settings
2. Refresh page (without ?lang parameter)
3. Should auto-detect new language

## User Experience

For a user in Japan:
1. **Automatic**: Page loads → detects `ja` language
2. **Special components** show: "繁栄" / "すべての人のために" / "人類"
3. **Drone screen** shows: "クラウドターミナル", "トークンを取得"
4. **Regular headings** show Japanese (if using `t()` function)
5. **No action required** from user!

## Important Notes

- **Don't use Chrome's page translator** - It conflicts with animated components
- **Always test** special characters in different languages
- **Keep keys consistent** across all language files
- **Fallback** - If translation missing, shows the key (e.g., "home.welcome")

## Common Issues

**Text not translating?**
- Check if using `t()` function for regular text
- Verify key exists in translation file
- Ensure component uses `useLanguage()` hook

**Drone screen not updating?**
- Language must be in `object.userData.language`
- Check `getDroneText()` is being called

**Animation broken?**
- Don't use browser's page translator
- Check TranslatableDropInTitle has `language` prop

## Example: Full Implementation

```jsx
// In your page component
import { useLanguage } from '@/components/LanguageProvider';
import TranslatableDropInTitle from '@/components/TranslatableDropInTitle';

export default function MyPage() {
  const { locale: language, t } = useLanguage();
  
  return (
    <>
      {/* Animated title */}
      <TranslatableDropInTitle 
        lines={["PROSPER80", "FOR ALL", "HUMAN80!"]}
        language={language}
      />
      
      {/* Regular heading */}
      <h1>{t('home.welcome')}</h1>
      
      {/* Button */}
      <button>{t('home.buyNow')}</button>
      
      {/* Pass language to components with drone screens */}
      <DroneModel language={language} />
    </>
  );
}
```

---

*System created December 2024 - Handles both special animated components and regular text translations seamlessly.*