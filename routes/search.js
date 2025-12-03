import express from 'express';
import client from '../config/elasticsearch.js';

const router = express.Router();

const INDEX = 'orders';
const PAGE_SIZE = 5000;
export const searchOrdersInES = async (keyword, filed = 'orderNameXPwId', filters = {}) => {
  const ids = [];
  let searchAfter = null;
  let total = 0;
  let hasMore = true;

  const normalizedKeyword = keyword.toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();

  const searchQueries = [
    {
      wildcard: {
        [`${filed}.keyword`]: {
          value: `*${normalizedKeyword}*`,
          case_insensitive: true
        }
      }
    }
  ];

  if (filters.sellerId && sellerRoles.includes(filters.roleCode)) {
    searchQueries.push({
      term: {
        sellerId: filters.sellerId
      }
    });
  }

  // if (filters.sellerEmail && sellerRoles.includes(filters.roleCode)) {
  //   mustQueries.push({
  //     term: {
  //       sellerEmail: filters.sellerEmail
  //     }
  //   });
  // }

  try {
    while (hasMore) {
      const body = {
        index: INDEX,
        size: PAGE_SIZE,
        // _source: false, // chỉ lấy id cho nhẹ
        query: {
          bool: {
            must: searchQueries
          }
        }
      };

      if (searchAfter) {
        body.search_after = searchAfter;
      }
      const result = await elasticsearchService.search(body);
      const { hits } = result.hits;
      if (hits.length === 0) {
        hasMore = false;
        break;
      }
      // Lấy _id
      hits.map((item) => ids.push(item?._source?.orderId));
      searchAfter = hits[hits.length - 1].sort;
      total = result.hits.total.value;
      if (ids.length >= total) {
        hasMore = false;
        break;
      }
    }
  }
  catch (error) {
    logger.error(error);
    return { ids: [], total: 0 };
  }

  return { ids, total };
};

// 1. 基础全文搜索
router.post('/basic', async (req, res) => {
  try {
    const { index = 'orders', query, fields = ['*'] } = req.body;

    if (!query) {
      return res.status(400).json({ error: '查询参数 query 是必需的' });
    }

    const searchFields = Array.isArray(fields) && fields.length === 1 && fields[0] === '*' 
      ? ['*'] 
      : fields;

    const response = await client.search({
      index,
      body: {
        query: {
          multi_match: {
            query,
            fields: searchFields,
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        }
      }
    });

    res.json({
      total: response.hits.total.value,
      took: response.took,
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

// 2. 精确匹配搜索
router.post('/match', async (req, res) => {
  try {
    const { index = 'orders', field, value } = req.body;

    if (!field || !value) {
      return res.status(400).json({ error: 'field 和 value 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          match: {
            [field]: value
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

// 3. 精确值匹配（keyword）
router.post('/term', async (req, res) => {
  try {
    const { index = 'orders', field, value } = req.body;

    if (!field || value === undefined) {
      return res.status(400).json({ error: 'field 和 value 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          term: {
            [field]: value
          }
        }
      }
    });

    res.json({
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

// 4. 多值精确匹配
router.post('/terms', async (req, res) => {
  try {
    const { index = 'orders', field, values } = req.body;

    if (!field || !Array.isArray(values)) {
      return res.status(400).json({ error: 'field 和 values (数组) 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          terms: {
            [field]: values
          }
        }
      }
    });

    res.json({
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

// 5. 范围查询
router.post('/range', async (req, res) => {
  try {
    const { index = 'orders', field, gte, lte, gt, lt } = req.body;

    if (!field) {
      return res.status(400).json({ error: 'field 是必需的' });
    }

    const rangeQuery = {};
    if (gte !== undefined) rangeQuery.gte = gte;
    if (lte !== undefined) rangeQuery.lte = lte;
    if (gt !== undefined) rangeQuery.gt = gt;
    if (lt !== undefined) rangeQuery.lt = lt;

    const response = await client.search({
      index,
      body: {
        query: {
          range: {
            [field]: rangeQuery
          }
        }
      }
    });

    res.json({
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

// 6. 前缀搜索
router.post('/prefix', async (req, res) => {
  try {
    const { index = 'orders', field, prefix } = req.body;

    if (!field || !prefix) {
      return res.status(400).json({ error: 'field 和 prefix 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          prefix: {
            [field]: prefix
          }
        }
      }
    });

    res.json({
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

// 7. 通配符搜索
router.post('/wildcard', async (req, res) => {
  try {
    const { index = 'orders', field, wildcard } = req.body;

    if (!field || !wildcard) {
      return res.status(400).json({ error: 'field 和 wildcard 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          wildcard: {
            [field]: {
              value: wildcard
            }
          }
        }
      }
    });

    res.json({
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

// 8. 模糊搜索
router.post('/fuzzy', async (req, res) => {
  try {
    const { index = 'orders', field, value, fuzziness = 'AUTO' } = req.body;

    if (!field || !value) {
      return res.status(400).json({ error: 'field 和 value 是必需的' });
    }

    const response = await client.search({
      index,
      body: {
        query: {
          fuzzy: {
            [field]: {
              value,
              fuzziness
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

// 9. 布尔查询（AND, OR, NOT）
router.post('/bool', async (req, res) => {
  try {
    const { index = 'orders', must, must_not, should, filter } = req.body;

    if (!index) {
      return res.status(400).json({ error: 'index 是必需的' });
    }

    const boolQuery = {};
    if (must) boolQuery.must = must;
    if (must_not) boolQuery.must_not = must_not;
    if (should) boolQuery.should = should;
    if (filter) boolQuery.filter = filter;

    const response = await client.search({
      index,
      body: {
        query: {
          bool: boolQuery
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

// 10. 分页搜索
router.post('/paginated', async (req, res) => {
  try {
    const { 
      index = 'orders', 
      query, 
      page = 1, 
      size = 10,
      sort = []
    } = req.body;

    const from = (page - 1) * size;

    const searchBody = {
      from,
      size,
      query: query || { match_all: {} }
    };

    if (sort.length > 0) {
      searchBody.sort = sort;
    }

    const response = await client.search({
      index,
      body: searchBody
    });

    res.json({
      total: response.hits.total.value,
      page,
      size,
      totalPages: Math.ceil(response.hits.total.value / size),
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

