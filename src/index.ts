import express from 'express';
import imagesRouter from './routes/api/images';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Image Processing API</h1>
    <p>Usage: GET /api/images?filename=example.jpg&width=200&height=200</p>
    <p>Available endpoints:</p>
    <ul>
      <li><a href="/api/images/list">GET /api/images/list</a> - List available images</li>
      <li>GET /api/images?filename=NAME&width=W&height=H - Process an image</li>
      <li>POST /api/images/clear-cache - Clear thumbnail cache</li>
    </ul>
  `);
});

app.use('/api/images', imagesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

export default app;
