import express from 'express';
import client from '../config/elasticsearch.js';

const router = express.Router();

// 创建索引
router.post('/create', async (req, res) => {
  try {
    const { index, settings, mappings } = req.body;

    if (!index) {
      return res.status(400).json({ error: 'index 名称是必需的' });
    }

    const indexBody = {};
    if (settings) indexBody.settings = settings;
    if (mappings) indexBody.mappings = mappings;

    const response = await client.indices.create({
      index,
      body: indexBody
    });

    res.json({
      success: true,
      message: `索引 ${index} 创建成功`,
      response
    });
  } catch (error) {
    if (error.meta?.body?.error?.type === 'resource_already_exists_exception') {
      return res.status(409).json({ 
        error: '索引已存在',
        message: error.message 
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// 检查索引是否存在
router.get('/exists/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const exists = await client.indices.exists({ index });
    res.json({ exists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取索引信息
router.get('/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const response = await client.indices.get({ index });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除索引
router.delete('/:index', async (req, res) => {
  try {
    const { index } = req.params;
    const response = await client.indices.delete({ index });
    res.json({
      success: true,
      message: `索引 ${index} 已删除`,
      response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 索引文档
router.post('/:index/document', async (req, res) => {
  try {
    const { index } = req.params;
    const { id, document } = req.body;

    if (!document) {
      return res.status(400).json({ error: 'document 是必需的' });
    }

    const params = {
      index,
      document
    };

    if (id) {
      params.id = id;
    }

    const response = await client.index(params);

    res.json({
      success: true,
      id: response._id,
      result: response.result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量索引文档
router.post('/:index/bulk', async (req, res) => {
  try {
    const { index } = req.params;
    const { documents } = req.body;

    if (!Array.isArray(documents)) {
      return res.status(400).json({ error: 'documents 必须是数组' });
    }

    const operations = documents.flatMap(doc => [
      { index: { _index: index, _id: doc.id } },
      doc.document || doc
    ]);

    const response = await client.bulk({ body: operations });

    const errors = response.items.filter(item => item.index?.error);
    const success = response.items.filter(item => !item.index?.error);

    res.json({
      success: true,
      total: documents.length,
      successful: success.length,
      failed: errors.length,
      errors: errors.map(e => e.index?.error)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新文档
router.put('/:index/document/:id', async (req, res) => {
  try {
    const { index, id } = req.params;
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ error: 'document 是必需的' });
    }

    const response = await client.update({
      index,
      id,
      doc: document
    });

    res.json({
      success: true,
      result: response.result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除文档
router.delete('/:index/document/:id', async (req, res) => {
  try {
    const { index, id } = req.params;
    const response = await client.delete({ index, id });
    res.json({
      success: true,
      result: response.result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取文档
router.get('/:index/document/:id', async (req, res) => {
  try {
    const { index, id } = req.params;
    const response = await client.get({ index, id });
    res.json({
      id: response._id,
      source: response._source
    });
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      return res.status(404).json({ error: '文档不存在' });
    }
    res.status(500).json({ error: error.message });
  }
});

// 刷新索引
router.post('/:index/refresh', async (req, res) => {
  try {
    const { index } = req.params;
    const response = await client.indices.refresh({ index });
    res.json({
      success: true,
      message: `索引 ${index} 已刷新`,
      response
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取索引统计信息
router.get('/:index/stats', async (req, res) => {
  try {
    const { index } = req.params;
    const response = await client.indices.stats({ index });
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

