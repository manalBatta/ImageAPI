# Image Processing API - Project Submission

A scalable Image Processing API built with Node.js, Express, and TypeScript. This API provides on-the-fly image resizing with intelligent caching.

## 📋 Project Overview

This API serves two purposes:
1. **Placeholder API**: Generate images at specified dimensions for rapid prototyping
2. **Image Optimization**: Serve properly scaled images to reduce page load size

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. **Extract/Clone the project**
   ```bash
   # If using zip, extract it
   # If using git:
   git clone <repository-url>
   cd image-processing-api
   
2. **Install dependencies**
   ```bash
   npm install
3. **Verify images are present**
   ```bash
   ls assets/full/
  Expected output:
        
        encenadaport.jpg
        fjord.jpg
        icelandwaterfall.jpg
        palmtunnel.jpg
        santamonica.jpg

4. **Build the project**
   ```bash
   npm run build

5. **Run tests**
   ```bash
    npm test
6. **Start the server**
   ```bash
   npm run dev


**Test this endpoint:**
```bash
# Using curl
curl "http://localhost:3000/api/images?filename=fjord.jpg&width=200&height=200"

# Or open in browser
open "http://localhost:3000/api/images?filename=fjord.jpg&width=200&height=200"
