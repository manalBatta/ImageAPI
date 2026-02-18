import imageProcessor from '../../src/utils/imageProcessor';
import fs from 'fs';
import path from 'path';

describe('Image Processor Utility', () => {
  const testImage = 'fjord.jpg'; // Make sure this exists in assets/full

  beforeAll(() => {
    // Clear cache before tests
    imageProcessor.clearCache();
  });

  it('should throw error for missing filename', async () => {
    await expectAsync(imageProcessor.processImage('', { width: 100 })).toBeRejected();
  });

  it('should throw error for non-existent image', async () => {
    await expectAsync(
      imageProcessor.processImage('nonexistent.jpg', { width: 100 })
    ).toBeRejectedWithError(/not found/);
  });

  it('should throw error when no dimensions provided', async () => {
    await expectAsync(imageProcessor.processImage(testImage, {})).toBeRejectedWithError(
      /At least one dimension/
    );
  });

  // Skip this test if test image doesn't exist
  if (fs.existsSync(path.join(__dirname, '../../assets/full', testImage))) {
    it('should process image with width only', async () => {
      const result = await imageProcessor.processImage(testImage, { width: 200 });
      expect(result).toBeTruthy();
      expect(fs.existsSync(result)).toBeTrue();
    });

    it('should process image with height only', async () => {
      const result = await imageProcessor.processImage(testImage, { height: 150 });
      expect(result).toBeTruthy();
      expect(fs.existsSync(result)).toBeTrue();
    });

    it('should process image with both dimensions', async () => {
      const result = await imageProcessor.processImage(testImage, { width: 300, height: 200 });
      expect(result).toBeTruthy();
      expect(fs.existsSync(result)).toBeTrue();
    });

    it('should return cached image on second request', async () => {
      // First request
      const firstResult = await imageProcessor.processImage(testImage, { width: 400 });
      
      // Second request (should use cache)
      const secondResult = await imageProcessor.processImage(testImage, { width: 400 });
      
      expect(firstResult).toBe(secondResult);
    });
  }
});