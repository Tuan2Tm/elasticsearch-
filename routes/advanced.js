import express from 'express';
import client from '../config/elasticsearch.js';

const router = express.Router();

// 1. 多字段搜索（最佳匹配）
router.post('/multi-match', async (req, res) => {
  try {
    const { index = 'orders', query, fields, type = 'best_fields', operator = 'or' } = req.body;

    if (!query || !fields) {
      return res.status(400).json({ error: 'query 和 fields 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          multi_match: {
            query,
            fields: Array.isArray(fields) ? fields : [fields],
            type,
            operator
          }
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. 短语匹配搜索
router.post('/match-phrase', async (req, res) => {
  try {
    const { index = 'orders', field, query, slop = 0 } = req.body;

    if (!field || !query) {
      return res.status(400).json({ error: 'field 和 query 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          match_phrase: {
            [field]: {
              query,
              slop
            }
          }
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. 高亮搜索
router.post('/highlight', async (req, res) => {
  try {
    const { index = 'orders', query, fields, highlight } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query 是必需的' });
    }

    const searchBody = {
      query: typeof query === 'string' 
        ? { multi_match: { query, fields: fields || ['*'] } }
        : query,
      highlight: highlight || {
        fields: fields ? 
          Object.fromEntries(fields.map(f => [f, {}])) :
          { '*': {} }
      }
    };

    const response = await client.search({
      index,
      body: searchBody
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source,
        highlight: hit.highlight || {}
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. 函数评分搜索
router.post('/function-score', async (req, res) => {
  try {
    const { index = 'orders', query, functions, boost_mode = 'multiply', score_mode = 'multiply' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query 是必需的' });
    }

    const functionScore = {
      query,
      functions: functions || [],
      boost_mode,
      score_mode
    };

    const response = await client.search({
      index,
      body: {
        query: {
          function_score: functionScore
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. 地理距离搜索
router.post('/geo-distance', async (req, res) => {
  try {
    const { index = 'orders', field, lat, lon, distance } = req.body;

    if (!field || lat === undefined || lon === undefined || !distance) {
      return res.status(400).json({ error: 'field, lat, lon 和 distance 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          geo_distance: {
            distance,
            [field]: {
              lat,
              lon
            }
          }
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. 嵌套查询
router.post('/nested-query', async (req, res) => {
  try {
    const { index = 'orders', path, query } = req.body;

    if (!path || !query) {
      return res.status(400).json({ error: 'path 和 query 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          nested: {
            path,
            query
          }
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. 脚本查询
router.post('/script-query', async (req, res) => {
  try {
    const { index = 'orders', script } = req.body;

    if (!script) {
      return res.status(400).json({ error: 'script 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          script: {
            script: script
          }
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. 滚动搜索（用于大数据集）
router.post('/scroll', async (req, res) => {
  try {
    const { index = 'orders', query, size = 1000, scroll = '1m' } = req.body;

    const searchBody = {
      index,
      body: {
        size,
        query: query || { match_all: {} }
      },
      scroll
    };

    const response = await client.search(searchBody);

    res.json({
      scroll_id: response._scroll_id,
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. 继续滚动搜索
router.post('/scroll/continue', async (req, res) => {
  try {
    const { scroll_id, scroll = '1m' } = req.body;

    if (!scroll_id) {
      return res.status(400).json({ error: 'scroll_id 是必需的' });
    }

    const response = await client.scroll({
      scroll_id,
      scroll
    });

    res.json({
      scroll_id: response._scroll_id,
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. 清除滚动上下文
router.post('/scroll/clear', async (req, res) => {
  try {
    const { scroll_id } = req.body;

    if (!scroll_id) {
      return res.status(400).json({ error: 'scroll_id 是必需的' });
    }

    await client.clearScroll({ scroll_id });

    res.json({
      success: true,
      message: '滚动上下文已清除'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. 搜索模板
router.post('/template', async (req, res) => {
  try {
    const { template_id, params } = req.body;

    if (!template_id) {
      return res.status(400).json({ error: 'template_id 是必需的' });
    }

    const response = await client.searchTemplate({
      id: template_id,
      params: params || {}
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. 建议搜索（自动完成）
router.post('/suggest', async (req, res) => {
  try {
    const { index = 'orders', text, field, size = 5 } = req.body;

    if (!text || !field) {
      return res.status(400).json({ error: 'text 和 field 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        suggest: {
          text,
          completion_suggest: {
            completion: {
              field,
              size
            }
          }
        }
      }
    });

    res.json({
      suggestions: response.suggest.completion_suggest[0].options
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13. 多索引搜索
router.post('/multi-index', async (req, res) => {
  try {
    const { indices, query, size = 10 } = req.body;

    if (!indices || !Array.isArray(indices)) {
      return res.status(400).json({ error: 'indices (数组) 是必需的' });
    }

    const response = await client.search({
      index: indices.join(','),
      body: {
        size,
        query: query || { match_all: {} }
      }
    });

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        index: hit._index,
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 14. 字段折叠（去重）
router.post('/collapse', async (req, res) => {
  try {
    const { index = 'orders', field, query, size = 10 } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const searchBody = {
      index,
      body: {
        size,
        query: query || { match_all: {} },
        collapse: {
          field
        }
      }
    };

    const response = await client.search(searchBody);

    res.json({
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 15. 解释查询
router.post('/explain', async (req, res) => {
  try {
    const { index = 'orders', id, query } = req.body;

    if (!id || !query) {
      return res.status(400).json({ error: 'id 和 query 是必需的' });
    }

    const response = await client.explain({
      index,
      id,
      body: {
        query
      }
    });

    res.json({
      explanation: response.explanation,
      matched: response.matched
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 16. 验证查询
router.post('/validate', async (req, res) => {
  try {
    const { index = 'orders', query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query 是必需的' });
    }

    const response = await client.indices.validateQuery({
      index,
      body: {
        query
      }
    });

    res.json({
      valid: response.valid,
      explanations: response.explanations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 17. 批量搜索
router.post('/msearch', async (req, res) => {
  try {
    const { searches } = req.body;

    if (!Array.isArray(searches)) {
      return res.status(400).json({ error: 'searches 必须是数组' });
    }

    const body = searches.flatMap(search => [
      { index: search.index || 'orders' },
      { query: search.query || { match_all: {} } }
    ]);

    const response = await client.msearch({ body });

    res.json({
      responses: response.responses.map((resp, idx) => ({
        index: searches[idx].index || 'orders',
        total: resp.hits?.total?.value || 0,
        results: resp.hits?.hits?.map(hit => ({
          id: hit._id,
          score: hit._score,
          source: hit._source
        })) || []
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 18. 性能分析
router.post('/profile', async (req, res) => {
  try {
    const { index = 'orders', query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query,
        profile: true
      }
    });

    res.json({
      profile: response.profile,
      total: response.hits.total.value,
      results: response.hits.hits.map(hit => ({
        id: hit._id,
        score: hit._score,
        source: hit._source
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

