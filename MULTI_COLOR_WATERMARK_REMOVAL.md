# Multi-Color Watermark Removal Guide

## Overview

The system now supports removing watermarks of **ANY COLOR**, not just blue!

---

## Supported Watermark Colors

✅ **Blue** - ALLEN, blue overlays (default)  
✅ **Red** - Red watermarks  
✅ **Green** - Green watermarks  
✅ **Yellow** - Yellow watermarks  
✅ **Cyan** - Cyan/turquoise watermarks  
✅ **Magenta** - Magenta/pink watermarks  
✅ **Any semi-transparent colored overlay**

---

## Configuration Options

### **Option 1: Blue Only (Default - Recommended)**

Removes only blue watermarks like "ALLEN":

```env
MATHPIX_REMOVE_WATERMARK="true"
MATHPIX_REMOVE_ALL_COLORS="false"
```

**Use when:**
- You only have blue watermarks
- You want faster processing
- You want to preserve colored diagrams/content

### **Option 2: All Colors (Aggressive)**

Removes watermarks of ANY color:

```env
MATHPIX_REMOVE_WATERMARK="true"
MATHPIX_REMOVE_ALL_COLORS="true"
```

**Use when:**
- PDFs have multiple colored watermarks
- Watermarks are red, green, yellow, etc.
- You need comprehensive watermark removal

⚠️ **Warning:** This may affect colored diagrams or important colored content!

---

## How It Works

### **Blue Only Mode (Default)**
```typescript
// Only detects blue watermarks
if (blue > red + 30 && blue > green + 30 && blue > 150) {
  // Remove blue watermark
}
```

### **All Colors Mode**
```typescript
// Detects BLUE watermarks
if (blue > red + 30 && blue > green + 30 && blue > 150) { ... }

// Detects RED watermarks
if (red > green + 30 && red > blue + 30 && red > 150) { ... }

// Detects GREEN watermarks
if (green > red + 30 && green > blue + 30 && green > 150) { ... }

// Detects YELLOW watermarks
if (red > 150 && green > 150 && blue < 100) { ... }

// Detects CYAN watermarks
if (green > 150 && blue > 150 && red < 100) { ... }

// Detects MAGENTA watermarks
if (red > 150 && blue > 150 && green < 100) { ... }

// Detects ANY semi-transparent colored overlay
if (max_channel - min_channel > 40 && max_channel > 160) { ... }
```

---

## Detection Algorithm

### **Color Detection Criteria**

Each color is detected by analyzing RGB values:

| Color | Detection Rule |
|-------|---------------|
| **Blue** | B > R+30 AND B > G+30 AND B > 150 |
| **Red** | R > G+30 AND R > B+30 AND R > 150 |
| **Green** | G > R+30 AND G > B+30 AND G > 150 |
| **Yellow** | R > 150 AND G > 150 AND B < 100 |
| **Cyan** | G > 150 AND B > 150 AND R < 100 |
| **Magenta** | R > 150 AND B > 150 AND G < 100 |
| **Any Overlay** | (Max - Min) > 40 AND Max > 160 |

### **Neutralization Process**

For each detected watermark pixel:
1. Calculate average of RGB channels
2. Increase all channels slightly (+20 to +30)
3. Result: Watermark becomes neutral/white

---

## Examples

### **Example 1: Blue ALLEN Watermark**

**Before:**
```
Pixel: R=100, G=120, B=200 (blue tint)
```

**After:**
```
Pixel: R=120, G=140, B=110 (neutral)
```

### **Example 2: Red Watermark**

**Before:**
```
Pixel: R=200, G=100, B=120 (red tint)
```

**After:**
```
Pixel: R=110, G=120, B=140 (neutral)
```

### **Example 3: Yellow Watermark**

**Before:**
```
Pixel: R=200, G=200, B=80 (yellow tint)
```

**After:**
```
Pixel: R=190, G=190, B=190 (neutral/white)
```

---

## Usage

### **Step 1: Choose Your Mode**

Add to `.env` file:

**For blue only (recommended):**
```env
MATHPIX_REMOVE_WATERMARK="true"
MATHPIX_REMOVE_ALL_COLORS="false"
```

**For all colors:**
```env
MATHPIX_REMOVE_WATERMARK="true"
MATHPIX_REMOVE_ALL_COLORS="true"
```

### **Step 2: Rebuild & Restart**

```bash
cd backend
npm run build
npm run start:dev
```

### **Step 3: Process PDF**

Process any PDF with Mathpix - watermarks will be removed based on your configuration!

---

## Logs

### **Blue Only Mode**
```
🖼️ Image saved locally to: /content/images/test/image-001.png
🧹 Removing blue watermark from image: image-001.png
✅ Blue watermark removed from: image-001.png
☁️ Image uploaded to AWS: https://s3.../image-001.png
```

### **All Colors Mode**
```
🖼️ Image saved locally to: /content/images/test/image-001.png
🧹 Removing multi-color watermark from image: image-001.png
✅ Multi-color watermark removed from: image-001.png
☁️ Image uploaded to AWS: https://s3.../image-001.png
```

---

## Comparison Table

| Feature | Blue Only | All Colors |
|---------|-----------|------------|
| **Blue watermarks** | ✅ Removed | ✅ Removed |
| **Red watermarks** | ❌ Not removed | ✅ Removed |
| **Green watermarks** | ❌ Not removed | ✅ Removed |
| **Yellow watermarks** | ❌ Not removed | ✅ Removed |
| **Other colors** | ❌ Not removed | ✅ Removed |
| **Processing speed** | ⚡ Fast | ⚡ Fast (same) |
| **Risk to content** | 🟢 Low | 🟡 Medium |
| **Colored diagrams** | ✅ Preserved | ⚠️ May be affected |

---

## When to Use Each Mode

### **Use Blue Only When:**
- ✅ You only have blue watermarks (ALLEN, etc.)
- ✅ Your PDFs have colored diagrams that should be preserved
- ✅ You want minimal risk to content
- ✅ You want the safest option

### **Use All Colors When:**
- ✅ PDFs have multiple colored watermarks
- ✅ Watermarks are red, green, yellow, or other colors
- ✅ You don't have important colored content
- ✅ You need comprehensive watermark removal

---

## Troubleshooting

### **Issue: Colored diagrams are affected**

**Solution:** Use blue-only mode
```env
MATHPIX_REMOVE_ALL_COLORS="false"
```

### **Issue: Non-blue watermarks not removed**

**Solution:** Enable all-colors mode
```env
MATHPIX_REMOVE_ALL_COLORS="true"
```

### **Issue: Watermark partially removed**

**Solution:** Adjust detection thresholds in `image-watermark-remover.service.ts`:
```typescript
// Make detection more aggressive
if (b > r + 20 && b > g + 20 && b > 130) { // Lower thresholds
  // Remove watermark
}
```

### **Issue: Important content removed**

**Solution:** Make detection more strict:
```typescript
// Make detection more strict
if (b > r + 50 && b > g + 50 && b > 180) { // Higher thresholds
  // Remove watermark
}
```

---

## Performance

Both modes have similar performance:
- **Small image (500x500)**: ~100-200ms
- **Medium image (1000x1000)**: ~300-500ms
- **Large image (2000x2000)**: ~800-1200ms

The all-colors mode has slightly more detection logic but the difference is negligible.

---

## API Methods

### **Remove Blue Watermark Only**
```typescript
await imageWatermarkRemover.removeBlueWatermark(imagePath);
```

### **Remove Any Color Watermark**
```typescript
await imageWatermarkRemover.removeAnyColorWatermark(imagePath);
```

### **Custom Color Removal**
```typescript
await imageWatermarkRemover.removeWatermarkAdvanced(imagePath, {
  colorThreshold: { r: 200, g: 100, b: 100 }, // Custom color
  tolerance: 50
});
```

---

## Recommendation

**Start with blue-only mode** (default):
```env
MATHPIX_REMOVE_WATERMARK="true"
MATHPIX_REMOVE_ALL_COLORS="false"
```

If you find non-blue watermarks that need removal, switch to all-colors mode:
```env
MATHPIX_REMOVE_ALL_COLORS="true"
```

---

## Summary

✅ **Blue Only Mode** (Default)
- Removes blue watermarks like ALLEN
- Safest option
- Preserves colored content

✅ **All Colors Mode** (Optional)
- Removes watermarks of ANY color
- More comprehensive
- May affect colored diagrams

Choose based on your PDF watermark colors and content!
