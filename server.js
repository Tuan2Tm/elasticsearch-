import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/elasticsearch.js';
import searchRoutes from './routes/search.js';
import indexRoutes from './routes/index.js';
import aggregationRoutes from './routes/aggregation.js';
import advancedRoutes from './routes/advanced.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/search', searchRoutes);
app.use('/api/index', indexRoutes);
app.use('/api/aggregation', aggregationRoutes);
app.use('/api/advanced', advancedRoutes);

// 健康检查
app.get('/health', async (req, res) => {
  const esStatus = await testConnection();
  res.json({
    status: 'ok',
    elasticsearch: esStatus
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Elasticsearch API Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      search: '/api/search',
      index: '/api/index',
      aggregation: '/api/aggregation',
      advanced: '/api/advanced'
    }
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log('📝 测试 Elasticsearch 连接...');
  await testConnection();
});

export default app;

