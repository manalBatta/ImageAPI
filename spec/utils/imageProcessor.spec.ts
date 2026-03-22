import request from 'supertest';
import app from '../../src/index';
import fs from 'fs';
import path from 'path';
import imageProcessor from '../../src/utils/imageProcessor'; // Import your image processor

describe('Images API Endpoint', () => {
  const testImage = 'fjord.jpg';
  const fullImagePath = path.join(__dirname, '../../assets/full', testImage);

  beforeAll(() => {
    if (!fs.existsSync(fullImagePath)) {
      console.warn(`Warning: Test image ${testImage} not found in assets/full/`);
      const availableImages = fs.readdirSync(path.join(__dirname, '../../assets/full'))
        .filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
      console.log('Available images:', availableImages);
    }
  });

  // API endpoint tests (using supertest)
  describe('GET /api/images - Parameter Validation', () => {
    it('should return 400 if no filename provided', async () => {
      const response = await request(app).get('/api/images');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing filename parameter');
    });

    it('should return 404 if image not found', async () => {
      const response = await request(app).get('/api/images').query({
        filename: 'nonexistent.jpg',
        width: '200',
      });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Image not found');
    });

    it('should return 400 if no dimensions provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing dimensions');
    });

    it('should return 400 if invalid width provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: 'abc',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid width parameter');
    });
  });

  // Image processor unit tests
  describe('Image Processor Unit Tests', () => {
    it('should throw error for missing filename', async () => {
      await expectAsync(
        imageProcessor.processImage('', { width: 100 })
      ).toBeRejected();
    });

    it('should throw error for non-existent image', async () => {
      await expectAsync(
        imageProcessor.processImage('nonexistent.jpg', { width: 100 })
      ).toBeRejectedWithError(/not found/);
    });

    it('should throw error when no dimensions provided', async () => {
      await expectAsync(
        imageProcessor.processImage(testImage, {})
      ).toBeRejectedWithError(/At least one dimension/);
    });
  });

  // Integration tests that actually process images
  describe('Image Processing Integration Tests', () => {
    // Skip all tests if test image doesn't exist
    const imageExists = fs.existsSync(path.join(__dirname, '../../assets/full', testImage));

    if (!imageExists) {
      console.warn('Skipping integration tests - test image not found');
    }

    it('should process image with width only', async () => {
      if (!imageExists) {
        pending('Test image not found');
        return;
      }

      const result = await imageProcessor.processImage(testImage, { width: 200 });
      expect(result).toBeTruthy();
      expect(fs.existsSync(result)).toBe(true);
    });

    it('should process image with height only', async () => {
      if (!imageExists) {
        pending('Test image not found');
        return;
      }

      const result = await imageProcessor.processImage(testImage, { height: 150 });
      expect(result).toBeTruthy();
      expect(fs.existsSync(result)).toBe(true);
    });

    it('should process image with both dimensions', async () => {
      if (!imageExists) {
        pending('Test image not found');
        return;
      }

      const result = await imageProcessor.processImage(testImage, { width: 300, height: 200 });
      expect(result).toBeTruthy();
      expect(fs.existsSync(result)).toBe(true);
    });

    it('should return cached image on second request', async () => {
      if (!imageExists) {
        pending('Test image not found');
        return;
      }

      // First request
      const firstResult = await imageProcessor.processImage(testImage, { width: 400 });

      // Second request (should use cache)
      const secondResult = await imageProcessor.processImage(testImage, { width: 400 });

      expect(firstResult).toBe(secondResult);
    });
  });

  describe('GET /api/images - Successful Processing', () => {
    it('should return image with both width and height parameters', async () => {
      if (!fs.existsSync(fullImagePath)) {
        pending(`Test image ${testImage} not found`);
        return;
      }

      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: '200',
        height: '200',
      });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/');
    });
  });
});