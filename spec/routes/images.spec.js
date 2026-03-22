import request from 'supertest';
import app from '../../src/index';
import fs from 'fs';
import path from 'path';

describe('Images API Endpoint', () => {
  // Use one of your existing images
  const testImage = 'fjord.jpg'; // Change this to match one of your images
  const fullImagePath = path.join(__dirname, '../../assets/full', testImage);

  beforeAll(() => {
    // Check if test image exists
    if (!fs.existsSync(fullImagePath)) {
      console.warn(`Warning: Test image ${testImage} not found in assets/full/`);
      // List available images
      const availableImages = fs.readdirSync(path.join(__dirname, '../../assets/full'))
        .filter(f => f.match(/\.(jpg|jpeg|png|gif)$/i));
      console.log('Available images:', availableImages);
    }
  });

  describe('GET /api/images - Parameter Validation', () => {
    it('should return 400 if no filename provided', async () => {
      const response = await request(app).get('/api/images');
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing filename parameter');
    });

    it('should return 400 if invalid width provided (non-numeric)', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: 'abc',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid width parameter');
    });

    it('should return 400 if invalid height provided (non-numeric)', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        height: 'xyz',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid height parameter');
    });

    it('should return 400 if negative width provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: '-100',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid width parameter');
    });

    it('should return 400 if zero width provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: '0',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid width parameter');
    });

    it('should return 400 if decimal width provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: '100.5',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid width parameter');
    });

    it('should return 400 if negative height provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        height: '-100',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid height parameter');
    });

    it('should return 400 if zero height provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        height: '0',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid height parameter');
    });

    it('should return 400 if decimal height provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
        height: '150.7',
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid height parameter');
    });

    it('should return 400 if no dimensions provided', async () => {
      const response = await request(app).get('/api/images').query({
        filename: testImage,
      });
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing dimensions');
    });

    it('should return 404 if image not found', async () => {
      const response = await request(app).get('/api/images').query({
        filename: 'nonexistent-image-that-does-not-exist.jpg',
        width: '200',
      });
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Image not found');
    });
  });

  describe('GET /api/images - Successful Processing', () => {
    it('should return image with both width and height parameters', async () => {
      // Skip if test image doesn't exist
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
      expect(response.headers['content-length']).toBeDefined();
      expect(parseInt(response.headers['content-length'])).toBeGreaterThan(0);
    });

    it('should return image with only width parameter', async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(fullImagePath)) {
        pending(`Test image ${testImage} not found`);
        return;
      }

      const response = await request(app).get('/api/images').query({
        filename: testImage,
        width: '150',
      });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/');
    });

    it('should return image with only height parameter', async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(fullImagePath)) {
        pending(`Test image ${testImage} not found`);
        return;
      }

      const response = await request(app).get('/api/images').query({
        filename: testImage,
        height: '150',
      });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image/');
    });

    it('should return cached image on second request', async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(fullImagePath)) {
        pending(`Test image ${testImage} not found`);
        return;
      }

      // First request
      const response1 = await request(app).get('/api/images').query({
        filename: testImage,
        width: '300',
        height: '200',
      });
      expect(response1.status).toBe(200);

      // Second request (should be faster/cached)
      const response2 = await request(app).get('/api/images').query({
        filename: testImage,
        width: '300',
        height: '200',
      });
      expect(response2.status).toBe(200);
      
      // Both responses should be successful
      expect(response1.headers['content-type']).toBe(response2.headers['content-type']);
    });
  });

  describe('GET /api/images/list', () => {
    it('should return list of images', async () => {
      const response = await request(app).get('/api/images/list');
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.images).toBeDefined();
      expect(Array.isArray(response.body.images)).toBe(true);
      
      // Log the available images
      console.log(`Found ${response.body.images.length} images:`, response.body.images);
      
      // If we have our test image, it should be in the list
      if (fs.existsSync(fullImagePath)) {
        const found = response.body.images.includes(testImage);
        expect(found).toBe(true);
      }
    });
  });

  describe('POST /api/images/clear-cache', () => {
    it('should clear the cache', async () => {
      // Skip if test image doesn't exist
      if (!fs.existsSync(fullImagePath)) {
        pending(`Test image ${testImage} not found`);
        return;
      }

      // First, process an image to create cache
      await request(app).get('/api/images').query({
        filename: testImage,
        width: '100',
        height: '100',
      });

      const response = await request(app).post('/api/images/clear-cache');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cache cleared successfully');
    });

    it('should return success even if cache is empty', async () => {
      const response = await request(app).post('/api/images/clear-cache');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Cache cleared successfully');
    });
  });

  describe('GET / (root endpoint)', () => {
    it('should return HTML documentation', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Image Processing API');
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route-that-does-not-exist');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });
});