import express from 'express';
import imageProcessor from '../../utils/imageProcessor';

const imagesRouter = express.Router();

// GET /api/images?filename=example.jpg&width=200&height=200
imagesRouter.get('/', async (req, res) => {
  try {
    const { filename, width, height } = req.query;

    // Validate required parameters
    if (!filename) {
      return res.status(400).json({
        error: 'Missing filename parameter',
        message: 'Please provide an image filename',
      });
    }

    // Parse dimensions
    let parsedWidth: number | undefined;
    let parsedHeight: number | undefined;

    // Validate width if provided
    if (width) {
      // Check if it's a valid number
      if (isNaN(Number(width))) {
        return res.status(400).json({
          error: 'Invalid width parameter',
          message: 'Width must be a valid number',
        });
      }

      parsedWidth = parseInt(width as string);

      // Check if it's a positive integer
      if (parsedWidth <= 0) {
        return res.status(400).json({
          error: 'Invalid width parameter',
          message: 'Width must be a positive number',
        });
      }

      // Check if it's an integer (no decimal)
      if (parsedWidth !== parseFloat(width as string)) {
        return res.status(400).json({
          error: 'Invalid width parameter',
          message: 'Width must be an integer',
        });
      }
    }

    // Validate height if provided
    if (height) {
      // Check if it's a valid number
      if (isNaN(Number(height))) {
        return res.status(400).json({
          error: 'Invalid height parameter',
          message: 'Height must be a valid number',
        });
      }

      parsedHeight = parseInt(height as string);

      // Check if it's a positive integer
      if (parsedHeight <= 0) {
        return res.status(400).json({
          error: 'Invalid height parameter',
          message: 'Height must be a positive number',
        });
      }

      // Check if it's an integer (no decimal)
      if (parsedHeight !== parseFloat(height as string)) {
        return res.status(400).json({
          error: 'Invalid height parameter',
          message: 'Height must be an integer',
        });
      }
    }

    // Check if at least one dimension is provided
    if (!parsedWidth && !parsedHeight) {
      return res.status(400).json({
        error: 'Missing dimensions',
        message: 'Please provide at least one dimension (width or height)',
      });
    }

    // Process the image
    const processedImagePath = await imageProcessor.processImage(filename as string, {
      width: parsedWidth,
      height: parsedHeight,
    });

    // Send the processed image
    res.sendFile(processedImagePath);
  } catch (error) {
    // Handle different types of errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Image not found',
          message: error.message,
        });
      }

      // Log the error for debugging
      console.error('Image processing error:', error);

      return res.status(500).json({
        error: 'Image processing failed',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Unknown error occurred',
      message: 'An unexpected error occurred',
    });
  }
});

// GET /api/images/list - Get available images
imagesRouter.get('/list', (req, res) => {
  try {
    const images = imageProcessor.getAvailableImages();
    res.json({ images });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list images',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/images/clear-cache - Clear thumbnail cache
imagesRouter.post('/clear-cache', (req, res) => {
  try {
    imageProcessor.clearCache();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default imagesRouter;
